import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (credentials, userType = 'user') => {
    try {
      // Get users from localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Find user with matching credentials
      const user = users.find(u => 
        u.email === credentials.email && 
        u.password === credentials.password &&
        (userType === 'user' ? !u.role : u.role === userType)
      );
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Create a user object without password
      const userWithoutPassword = { ...user };
      delete userWithoutPassword.password;
      
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('Registering user:', userData); // Debug log
      
      // Get existing users or initialize empty array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if email already exists
      if (users.some(user => user.email === userData.email)) {
        throw new Error('Email already exists');
      }
      
      // Add new user
      const newUser = {
        ...userData,
        id: Date.now().toString(),
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      console.log('Created new user:', newUser); // Debug log
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      // Create a user object without password for the session
      const userWithoutPassword = { ...newUser };
      delete userWithoutPassword.password;
      
      console.log('Setting user session:', userWithoutPassword); // Debug log
      
      localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      setUser(userWithoutPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};