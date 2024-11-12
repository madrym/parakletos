'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface UserContextType {
  convexUserId: string | null;
}

const UserContext = createContext<UserContextType>({ convexUserId: null });

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useUser();
  const [convexUserId, setConvexUserId] = useState<string | null>(null);
  const convexUser = useQuery(api.users.getUser, { tokenIdentifier: user?.id ?? '' });

  useEffect(() => {
    if (convexUser?._id) {
      setConvexUserId(convexUser._id);
    }
  }, [convexUser]);

  return (
    <UserContext.Provider value={{ convexUserId }}>
      {children}
    </UserContext.Provider>
  );
};

export const useConvexUser = () => useContext(UserContext);