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
    // Demo user data with subscription
    const demoUser = {
      id: "demo123",
      name: "Mim",
      email: "user@gmail.com",
      password: "123",
      phone: "01700000000",
      role: "user",
      subscription: {
        id: "sub123",
        plan_type: "weekly",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 756,
        status: "active",
        pickup_location: {
          latitude: 23.7576,
          longitude: 90.4208,
          address: "Rampura, Dhaka, Bangladesh"
        },
        drop_location: {
          latitude: 23.7969,
          longitude: 90.4199,
          address: "Notun Bazar, Dhaka, Bangladesh"
        }
      },
      rides: [
        {
          id: "ride1",
          date: new Date().toISOString(),
          status: "active",
          pickup: "Rampura, Dhaka, Bangladesh",
          destination: "Notun Bazar, Dhaka, Bangladesh",
          fare: 200,
          currentLocation: {
            latitude: 23.7776,
            longitude: 90.4203
          }
        },
        {
          id: "ride2",
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          status: "completed",
          pickup: "Rampura, Dhaka, Bangladesh",
          destination: "Notun Bazar, Dhaka, Bangladesh",
          fare: 200
        }
      ]
    };

    setUser(demoUser);
    localStorage.setItem('user', JSON.stringify(demoUser));
    setLoading(false);
  }, []);

  const login = async (credentials, userType = 'user') => {
    try {
      // Check for demo user credentials
      if (credentials.email !== 'user@gmail.com' || credentials.password !== '123') {
        throw new Error('Invalid credentials');
      }

      // Demo user data
      const user = {
        id: "demo123",
        name: "Mim",
        email: "user@gmail.com",
        phone: "01700000000",
        role: "user",
        subscription: {
          id: "sub123",
          plan_type: "weekly",
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          price: 756,
          status: "active",
          pickup_location: {
            latitude: 23.7576,
            longitude: 90.4208,
            address: "Rampura, Dhaka"
          },
          drop_location: {
            latitude: 23.7969,
            longitude: 90.4199,
            address: "Notun Bazar, Dhaka"
          }
        },
        rides: [
          {
            id: "ride1",
            date: new Date().toISOString(),
            status: "active",
            pickup: "Rampura, Dhaka",
            destination: "Notun Bazar, Dhaka",
            fare: 756,
            currentLocation: {
              latitude: 23.7776,
              longitude: 90.4203
            }
          },
          {
            id: "ride2",
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: "completed",
            pickup: "Rampura, Dhaka",
            destination: "Notun Bazar, Dhaka",
            fare: 756
          }
        ]
      };
      
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