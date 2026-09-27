export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  authorName: string;
  dateText: string;
  prompt: string;          // e.g. "Сфотографируй воду"
  isCompleted: boolean;
  deadlineText: string;    // e.g. "Выполнение до 21.09"
  commentCount: number;
  completedPhotoUrl?: string;
  completedAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  friendId: string;
  friendName: string;      // e.g. "Друг 1"
  dateText: string;        // e.g. "20 сентября 2026"
  timeText: string;        // e.g. "13:20"
  lastMessage: string;     // e.g. "Привет!!"
  unread: boolean;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  photoUrl?: string;
  timeText: string;        // e.g. "12:00"
  isOutgoing: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeText: string;
  read: boolean;
}
