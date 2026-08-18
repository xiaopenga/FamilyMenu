import { request } from '../utils/request';

// 创建新对话
export const createConversation = () => {
  return request({
    url: '/ai/conversation',
    method: 'POST',
  });
};

// 获取对话列表
export const getConversationList = () => {
  return request({
    url: '/ai/conversations',
    method: 'GET',
  });
};

// 获取对话的消息记录
export const getConversationMessages = (conversationId: number) => {
  return request({
    url: `/ai/conversation/${conversationId}/messages`,
    method: 'GET',
  });
};

// 发送消息
export const sendMessage = (conversationId: number, content: string) => {
  return request({
    url: `/ai/conversation/${conversationId}/send`,
    method: 'POST',
    data: { content },
  });
};

// 删除对话
export const deleteConversation = (conversationId: number) => {
  return request({
    url: `/ai/conversation/${conversationId}`,
    method: 'DELETE',
  });
};
