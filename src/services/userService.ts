import { User } from '../types';

export const userService = {
  async getUserProfile(userId: string): Promise<User | null> {
    // In a real app, this would fetch from backend
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return null;
    
    const user = JSON.parse(currentUser);
    return user.id === userId ? user : null;
  },

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) throw new Error('User not found');
    
    const user = JSON.parse(currentUser);
    const updatedUser = { ...user, ...updates };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    return updatedUser;
  }
};