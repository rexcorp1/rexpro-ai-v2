
import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { User } from '../types';
import * as authService from '../services/authService';
import { User as UserIcon, Users, Plus } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen }) => {
    const { login, signUp, continueAsGuest } = useAppStore();
    const [localUsers, setLocalUsers] = useState<User[]>([]);
    const [view, setView] = useState<'login' | 'signup'>('login');
    const [newUserName, setNewUserName] = useState('');

    useEffect(() => {
        if (isOpen) {
            setLocalUsers(authService.getAllLocalUsers());
            setView('login');
            setNewUserName('');
        }
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }
    
    const handleSignUp = (e: React.FormEvent) => {
        e.preventDefault();
        if (newUserName.trim()) {
            signUp(newUserName.trim());
        }
    };
    
    const handleLogin = (user: User) => {
        login(user);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-background rounded-lg shadow-xl w-full max-w-sm flex flex-col">
                <div className="p-6 text-center">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-card">
                       <UserIcon className="h-6 w-6 text-text-primary" />
                    </div>
                    <h3 className="text-lg font-medium leading-6 text-text-primary mt-3">
                      {view === 'login' ? 'Welcome Back' : 'Create Profile'}
                    </h3>
                </div>

                {view === 'login' && (
                    <div className="px-6 pb-6 space-y-4">
                        {localUsers.length > 0 ? (
                            <>
                                <p className="text-sm text-text-secondary text-center">Select a profile to continue.</p>
                                <div className="space-y-2 max-h-40 overflow-y-auto hover-scrollbar pr-2">
                                    {localUsers.map(user => (
                                        <button 
                                            key={user.id}
                                            onClick={() => handleLogin(user)}
                                            className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-card hover:bg-interactive-hover transition-colors"
                                        >
                                            <Users className="h-4 w-4 text-text-secondary"/>
                                            <span className="font-medium text-text-primary">{user.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                             <p className="text-sm text-text-secondary text-center">No profiles found. Create one to get started.</p>
                        )}

                        <button 
                            onClick={() => setView('signup')}
                            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-text-primary text-background hover:opacity-90 transition-opacity font-semibold"
                        >
                            <Plus className="h-4 w-4"/>
                            Create New Profile
                        </button>
                    </div>
                )}

                {view === 'signup' && (
                     <form onSubmit={handleSignUp} className="px-6 pb-6 space-y-4">
                         <p className="text-sm text-text-secondary text-center">Enter a name for your new local profile.</p>
                         <div>
                            <input
                                type="text"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full p-3 border border-border rounded-lg text-sm text-text-primary bg-background focus:outline-none focus:ring-2 focus:ring-[#e5e7eb] focus:border-transparent"
                                autoFocus
                            />
                         </div>
                         <button 
                            type="submit"
                            className="w-full p-3 rounded-lg bg-text-primary text-background font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                            disabled={!newUserName.trim()}
                        >
                            Create & Continue
                        </button>
                        <button 
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full p-2 text-sm text-text-secondary hover:text-text-primary"
                        >
                           Back to profiles
                        </button>
                    </form>
                )}

                <div className="px-6 pb-6 border-t border-border pt-4">
                    <button
                        onClick={continueAsGuest}
                        className="w-full p-3 text-sm font-medium bg-text-primary text-background rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Continue as Guest
                    </button>
                    <p className="text-xs text-text-secondary text-center mt-2">As a guest, your chat history will not be saved between sessions.</p>
                </div>
            </div>
        </div>
    );
};
