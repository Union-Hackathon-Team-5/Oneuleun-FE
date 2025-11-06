import { useState, useEffect } from "react";

interface User {
    id: string;
    name?: string;
    type: "user" | "admin";
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 로컬 스토리지에서 사용자 정보 불러오기
        const loadUser = () => {
            try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error("사용자 정보 로드 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
    };

    return {
        user,
        isLoading,
        login,
        logout,
        isAuthenticated: !!user,
    };
}

