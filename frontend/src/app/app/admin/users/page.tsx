'use client';

import React from 'react';
import useSWR from 'swr';
import { adminService } from '@/services/admin';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminUsersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const { data: users, error, isLoading } = useSWR(
        (user as any)?.is_super_admin ? 'admin-users' : null,
        adminService.getUsers
    );

    useEffect(() => {
        if (!loading && !(user as any)?.is_super_admin) {
            router.push('/app');
        }
    }, [user, loading, router]);

    if (loading || isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>;

    if (!(user as any)?.is_super_admin) {
        return null;
    }

    if (error) return <div>Erro ao carregar usuários.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Gerenciamento de Usuários</h1>

            <div className="border rounded-lg bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Avatar</TableHead>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data de Cadastro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((user: any) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={user.user_metadata?.avatar_url} />
                                        <AvatarFallback>{user.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{user.user_metadata?.full_name || 'N/A'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">Ativo</Badge>
                                    {user.is_super_admin && (
                                        <Badge variant="default" className="bg-purple-600 hover:bg-purple-700">Super Admin</Badge>
                                    )}
                                </TableCell>
                                <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
