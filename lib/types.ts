export interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  avatarUrl?: string;
  token?: string;
  dailyTasksTakenToday?: number;
  createdAt?: string;
}

export interface UserSummary {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
  isOnline?: boolean;
  lastSeenText?: string;
}

export interface DailyChallenge {
  id: string;
  title: string;
  prompt: string;
  category: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  authorName: string;
  userId?: string;
  dateText: string;
  prompt: string;
  isCompleted: boolean;
  isFailed?: boolean;
  penalty?: string;
  deadlineText: string;
  expiresAt?: string;
  sourceType?: 'system' | 'self';
  commentCount: number;
  completedPhotoUrl?: string;
  completedAt?: string;
  challengeId?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorName: string;
  userId?: string;
  text: string;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  friendId: string;
  friendName: string;
  user1Id?: string;
  user2Id?: string;
  dateText: string;
  timeText: string;
  lastMessage: string;
  unread: boolean;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  text: string;
  photoUrl?: string;
  timeText: string;
  status?: 'sending' | 'delivered' | 'read';
  isOutgoing: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timeText: string;
  read: boolean;
}
