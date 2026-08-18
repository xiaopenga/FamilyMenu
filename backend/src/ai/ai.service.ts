import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from '../prisma.service';
import { Response } from 'express';

@Injectable()
export class AiService {
  private client: OpenAI;
  private model: string;
  private systemPrompt = {
    role: 'system',
    content: `你是一个家庭点餐助手，帮助用户决定今天吃什么。

你的能力：
1. 可以调用 search_dishes 工具查询用户的菜品库
2. 可以调用 get_recent_history 工具查询最近吃过的菜，避免重复推荐

推荐规则：
1. 优先从用户的菜品库中推荐，最多推荐 5 个
2. 如果菜品库中没有合适的，可以生成 1-2 个全新的菜谱建议
3. 尽量避免推荐最近 3 天吃过的菜
4. 回复要友好、简洁，用中文

重要：推荐全新菜谱时，必须严格按照以下格式输出（每个新菜谱单独一段）：

【新菜谱】
名称：菜名
食材：食材1, 食材2, 食材3
做法：步骤1；步骤2；步骤3
【结束】

例如：
【新菜谱】
名称：番茄炒蛋
食材：番茄2个, 鸡蛋3个, 盐适量, 糖少许
做法：鸡蛋打散炒熟盛出；番茄切块炒出汁；倒入鸡蛋翻炒，加盐糖调味即可。
【结束】

当用户描述需求时，先判断是否需要调用工具：
- 如果需要查菜品库或历史记录，就调用工具
- 工具返回结果后，整理成自然语言回复用户`,
  };

  constructor(private readonly prisma: PrismaService) {
    this.client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: process.env.DEEPSEEK_BASE_URL,
    });
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  // 工具定义：告诉 AI 有哪些工具可以调用
  private tools = [
    {
      type: 'function' as const,
      function: {
        name: 'search_dishes',
        description: '查询菜品库中的菜品，支持按关键词、标签、餐次筛选',
        parameters: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: '搜索关键词，比如菜名、食材、口味',
            },
            tagIds: {
              type: 'array',
              items: { type: 'number' },
              description: '标签 ID 列表，比如 [1, 2]',
            },
            mealType: {
              type: 'string',
              description:
                '餐次，可选值：BREAKFAST（早餐）、LUNCH（午餐）、DINNER（晚餐）',
            },
            limit: {
              type: 'number',
              description: '返回数量，最多 10 个',
            },
          },
          required: [],
        },
      },
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_recent_history',
        description: '查询最近 N 天吃过的菜品，用于避免重复推荐',
        parameters: {
          type: 'object',
          properties: {
            days: {
              type: 'number',
              description: '查询最近几天，默认 3 天',
            },
          },
          required: [],
        },
      },
    },
  ];

  // 执行工具调用
  private async executeTool(name: string, args: any, userId: number) {
    if (name === 'search_dishes') {
      return this.searchDishes(args, userId);
    }
    if (name === 'get_recent_history') {
      return this.getRecentHistory(args, userId);
    }
    return { error: '未知工具' };
  }

  // 工具1：查询菜品库
  private async searchDishes(args: any, userId: number) {
    const { keyword, tagIds, mealType, limit = 10 } = args;

    const where: any = {
      createdById: userId,
    };

    // 按关键词搜索（菜名 + 描述 + 标签名）
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { description: { contains: keyword } },
        // 按标签名搜索
        {
          tags: {
            some: {
              tag: {
                name: { contains: keyword },
              },
            },
          },
        },
      ];
    }

    // 按标签 ID 筛选
    if (tagIds && tagIds.length > 0) {
      where.tags = {
        some: {
          tagId: { in: tagIds },
        },
      };
    }

    // 按餐次筛选（mealTypes 是 Json 字段，暂不支持，后续优化）

    const dishes = await this.prisma.dish.findMany({
      where,
      include: {
        tags: {
          include: { tag: true },
        },
      },
      take: Math.min(limit, 10),
    });

    return dishes.map((dish) => ({
      id: dish.id,
      name: dish.name,
      description: dish.description,
      cookTime: dish.cookTime,
      difficulty: dish.difficulty,
      mealTypes: dish.mealTypes,
      image: dish.image,
      tags: dish.tags.map((t) => t.tag.name),
    }));
  }

  // 工具2：查询最近吃过的菜品
  private async getRecentHistory(args: any, userId: number) {
    const { days = 3 } = args;

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const histories = await this.prisma.history.findMany({
      where: {
        selectedById: userId,
        date: { gte: since },
      },
      select: { dishIds: true, date: true },
    });

    const dishIds = new Set<number>();
    histories.forEach((h) => {
      const ids = (h.dishIds as number[]) || [];
      ids.forEach((id) => dishIds.add(id));
    });

    // 查询这些菜品的名称
    const dishes = await this.prisma.dish.findMany({
      where: { id: { in: Array.from(dishIds) } },
      select: { id: true, name: true },
    });

    return {
      days,
      dishes,
      dishIds: Array.from(dishIds),
    };
  }

  // 主对话方法
  async chat(messages: any[], userId: number) {
    const allMessages = [this.systemPrompt, ...messages];

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: allMessages,
        tools: this.tools,
        tool_choice: 'auto',
      });

      const choice = response.choices[0];
      const message = choice.message;

      // 如果 AI 决定调用工具
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCalls: any[] = message.tool_calls || [];
        const toolResults: any[] = [];

        // 执行所有工具调用
        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);

          const result = await this.executeTool(
            functionName,
            functionArgs,
            userId,
          );
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result),
          });
        }

        // 把 AI 的消息和工具结果都加进去，再请求一次
        const secondResponse = await this.client.chat.completions.create({
          model: this.model,
          messages: [...allMessages, message, ...toolResults],
        });

        return {
          reply: secondResponse.choices[0].message.content,
          toolCalls: toolCalls.map((tc) => ({
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments),
          })),
        };
      }

      // 不需要调用工具，直接返回
      return {
        reply: message.content,
        toolCalls: [],
      };
    } catch (error) {
      console.error('AI 对话失败', error);
      throw new Error('AI 服务暂时不可用');
    }
  }

  // 创建新对话
  createConversation(userId: number) {
    return this.prisma.conversation.create({
      data: {
        userId,
        title: '新对话',
      },
    });
  }

  // 获取对话列表
  getConversationList(userId: number) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  // 获取对话的消息记录
  async getConversationMessages(userId: number, conversationId: number) {
    // 先确认对话属于这个用户
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('对话不存在');
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        toolCalls: true,
        createdAt: true,
      },
    });
  }

  // 发送消息（核心方法）
  async sendMessage(
    userId: number,
    conversationId: number,
    userContent: string,
  ) {
    // 1. 确认对话属于这个用户
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('对话不存在');
    }

    // 2. 保存用户消息
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'user',
        content: userContent,
      },
    });

    // 3. 如果是第一条消息，用它更新对话标题
    if (conversation.title === '新对话') {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          title: userContent.slice(0, 20), // 截取前20个字作为标题
        },
      });
    }

    // 4. 加载历史消息（最近 20 条，避免 token 过多）
    const historyMessages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 倒序回来（最早的在前）
    const sortedMessages = historyMessages.reverse().map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 5. 调用 AI 对话
    const aiResult = await this.chat(sortedMessages, userId);

    // 6. 保存 AI 回复
    await this.prisma.message.create({
      data: {
        conversationId,
        role: 'assistant',
        content: aiResult.reply || '',
        toolCalls: aiResult.toolCalls as any,
      },
    });

    // 7. 更新对话的 updatedAt
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return {
      reply: aiResult.reply,
      toolCalls: aiResult.toolCalls,
    };
  }

  // 删除对话
  async deleteConversation(userId: number, conversationId: number) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      throw new Error('对话不存在');
    }
    await this.prisma.conversation.delete({
      where: { id: conversationId },
    });
    return { success: true };
  }

  // 流式对话
  async streamMessage(
    userId: number,
    conversationId: number,
    userContent: string,
    res: Response,
  ) {
    let recommendedDishes: any[] = [];
    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      // 1. 确认对话属于用户
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!conversation) {
        res.write(`data: ${JSON.stringify({ error: '对话不存在' })}\n\n`);
        res.end();
        return;
      }

      // 2. 保存用户消息
      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'user',
          content: userContent,
        },
      });

      // 3. 更新对话标题
      if (conversation.title === '新对话') {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { title: userContent.slice(0, 20) },
        });
      }

      // 4. 加载历史消息
      const historyMessages = await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      const sortedMessages = historyMessages.reverse().map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const allMessages: any[] = [this.systemPrompt, ...sortedMessages];

      // 5. 第一次调用（非流式），判断是否需要工具调用
      const firstResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: allMessages,
        tools: this.tools,
        tool_choice: 'auto',
      });

      const firstMessage = firstResponse.choices[0].message;
      let finalMessages = allMessages;
      let toolCallsData: any = null;

      // 6. 如果需要工具调用
      if (firstMessage.tool_calls && firstMessage.tool_calls.length > 0) {
        const toolCalls: any[] = firstMessage.tool_calls;
        toolCallsData = toolCalls.map((tc) => ({
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments),
        }));
        const toolResults: any[] = [];

        for (const toolCall of toolCalls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          const result = await this.executeTool(
            functionName,
            functionArgs,
            userId,
          );
          // 如果是查菜品库，保存结果
          if (functionName === 'search_dishes' && Array.isArray(result)) {
            recommendedDishes = result;
          }

          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            name: functionName,
            content: JSON.stringify(result),
          });
        }

        finalMessages = [...allMessages, firstMessage, ...toolResults];
      }

      // 7. 第二次调用（流式），获取最终回复
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages: finalMessages,
        stream: true,
      });

      let fullReply = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content || '';
        if (delta) {
          fullReply += delta;
          // 推送给前端
          res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
        }
      }

      // 8. 保存 AI 回复
      await this.prisma.message.create({
        data: {
          conversationId,
          role: 'assistant',
          content: fullReply,
          toolCalls: toolCallsData,
        },
      });

      // 9. 更新对话时间
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });
      // 10. 如果有推荐菜品，先发送菜品信息
      if (recommendedDishes.length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: 'dishes',
            dishes: recommendedDishes,
          })}\n\n`,
        );
      }

      // 解析并发送新菜谱
      const newRecipes = this.parseNewRecipes(fullReply);
      if (newRecipes.length > 0) {
        res.write(
          `data: ${JSON.stringify({
            type: 'newRecipes',
            recipes: newRecipes,
          })}\n\n`,
        );
      }

      // 11. 发送结束标记
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error) {
      console.error('流式对话失败', error);
      res.write(`data: ${JSON.stringify({ error: 'AI 服务暂时不可用' })}\n\n`);
      res.end();
    }
  }

  // 解析 AI 回复中的新菜谱
  private parseNewRecipes(text: string) {
    const recipes: any[] = [];
    // 匹配 【新菜谱】...【结束】 之间的内容
    const regex = /【新菜谱】\s*([\s\S]*?)【结束】/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const block = match[1];
      const nameMatch = block.match(/名称[：:]\s*(.+)/);
      const ingredientsMatch = block.match(/食材[：:]\s*(.+)/);
      const stepsMatch = block.match(/做法[：:]\s*(.+)/);

      if (nameMatch) {
        recipes.push({
          name: nameMatch[1].trim(),
          ingredients: ingredientsMatch ? ingredientsMatch[1].trim() : '',
          steps: stepsMatch ? stepsMatch[1].trim() : '',
        });
      }
    }

    return recipes;
  }
}
