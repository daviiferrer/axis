'use client';

import React from 'react';
import useSWR, { mutate } from 'swr';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminUsersPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const { data: users, error, isLoading } = useSWR(
        (user as any)?.role === 'admin' ? 'admin-users' : null,
        adminService.getUsers
    );

    useEffect(() => {
        if (!loading && (user as any)?.role !== 'admin') {
            router.push('/app');
        }
    }, [user, loading, router]);

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            await adminService.updateUserRole(userId, newRole);
            toast.success("Cargo atualizado com sucesso!");
            mutate('admin-users'); // Refresh list
        } catch (e) {
            toast.error("Erro ao atualizar cargo do usuário.");
        }
    };

    if (loading || isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-20 w-full" /></div>;

    if ((user as any)?.role !== 'admin') {
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
                            <TableHead>Cargo (Role)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data de Cadastro</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.map((u: any) => (
                            <TableRow key={u.id}>
                                <TableCell>
                                    <Avatar>
                                        <AvatarImage src={u.user_metadata?.avatar_url} />
                                        <AvatarFallback>{u.email?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell className="font-medium">{u.user_metadata?.full_name || 'N/A'}</TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                    <Select
                                        defaultValue={u.role}
                                        onValueChange={(val) => handleRoleChange(u.id, val)}
                                        disabled={u.id === user?.id} // Prevent self-demotion lockout logic for safety (optional but good UX)
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin">Super Admin</SelectItem>
                                            <SelectItem value="owner">Owner (Cliente)</SelectItem>
                                            <SelectItem value="member">Member (Func.)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-2">Ativo</Badge>
                                </TableCell>
                                <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
