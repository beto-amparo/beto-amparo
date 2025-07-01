// pages/minha-conta.js

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { User, Lock, Mail, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button"; 
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function MinhaContaPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState({ email: '' });
    const [loading, setLoading] = useState(true);

    const [isEmailModalOpen, setEmailModalOpen] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [passwordForEmail, setPasswordForEmail] = useState('');
    const [savingEmail, setSavingEmail] = useState(false);

    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({
        senhaAtual: '', novaSenha: '', confirmarNovaSenha: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const API_BASE_URL = process.env.NEXT_PUBLIC_EMPRESA_API;

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await fetch(`${API_BASE_URL}/cliente/me`, { credentials: 'include' });
                if (!res.ok) {
                    router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
                    return;
                }
                const data = await res.json();
                setCurrentUser(data);
                setNewEmail(data.email);
            } catch (error) {
                toast.error('Erro ao carregar seus dados.');
                router.push('/');
            } finally {
                setLoading(false);
            }
        }
        fetchProfile();
    }, [router, API_BASE_URL]);

    const handleChange = (e) => { // Handler genérico para os inputs de senha
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        if (!newEmail || !passwordForEmail) {
            toast.error("Para alterar, preencha o novo email e sua senha atual.");
            return;
        }
        setSavingEmail(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cliente/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: newEmail, senhaAtual: passwordForEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha ao atualizar email.');
            
            toast.success('Email atualizado com sucesso!');
            setCurrentUser(prev => ({ ...prev, email: data.cliente.email }));
            setEmailModalOpen(false);
            setPasswordForEmail('');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingEmail(false);
        }
    };

    // ===============================================
    // ▼▼▼ FUNÇÃO QUE FALTAVA ADICIONADA AQUI ▼▼▼
    // ===============================================
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        const { senhaAtual, novaSenha, confirmarNovaSenha } = passwordData;

        if (!senhaAtual || !novaSenha || !confirmarNovaSenha) {
            toast.error("Preencha todos os campos para alterar a senha.");
            return;
        }
        if (novaSenha !== confirmarNovaSenha) {
            toast.error('A nova senha e a confirmação não correspondem.');
            return;
        }
        
        setSavingPassword(true);
        try {
            const res = await fetch(`${API_BASE_URL}/cliente/me`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ senhaAtual, novaSenha }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Falha ao atualizar senha.');
            
            toast.success('Senha atualizada com sucesso!');
            setPasswordModalOpen(false);
            setPasswordData({ senhaAtual: '', novaSenha: '', confirmarNovaSenha: '' });
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSavingPassword(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <>
            <div className="bg-slate-50 min-h-screen pt-12 pb-20 px-4">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-semibold transition-colors duration-300 group"
                        >
                            <ArrowLeft className="group-hover:-translate-x-1 transition-transform" size={20} />
                            Voltar
                        </button>
                    </div>
                    <div className="text-center mb-12">
                        <User className="mx-auto h-16 w-16 text-blue-600/80" />
                        <h1 className="mt-6 text-4xl font-extrabold text-gray-900">Minha Conta</h1>
                        <p className="mt-2 text-lg text-gray-600">Gerencie suas informações de acesso e segurança.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
                        <div className="flex justify-between items-center p-4 border-b">
                            <div>
                                <p className="font-semibold text-gray-800">Endereço de Email</p>
                                <p className="text-gray-600">{currentUser.email}</p>
                            </div>
                            <Button variant="outline" onClick={() => setEmailModalOpen(true)}>Alterar</Button>
                        </div>
                        <div className="flex justify-between items-center p-4">
                            <div>
                                <p className="font-semibold text-gray-800">Senha</p>
                                <p className="text-gray-600">••••••••</p>
                            </div>
                            <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>Alterar</Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Modal de Email --- */}
            <Dialog open={isEmailModalOpen} onOpenChange={setEmailModalOpen}>
                <DialogContent className="bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Alterar Endereço de Email</DialogTitle>
                        <DialogDescription>Para sua segurança, confirme a alteração com sua senha atual.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEmailSubmit} className="space-y-4 pt-4">
                        <div>
                            <label htmlFor="newEmail">Novo Email</label>
                            <Input id="newEmail" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                        </div>
                        <div>
                            <label htmlFor="passwordForEmail">Senha Atual</label>
                            <Input id="passwordForEmail" type="password" value={passwordForEmail} onChange={(e) => setPasswordForEmail(e.target.value)} required placeholder="••••••••" />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={savingEmail}>{savingEmail ? 'Salvando...' : 'Salvar Email'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* --- Modal de Senha --- */}
            <Dialog open={isPasswordModalOpen} onOpenChange={setPasswordModalOpen}>
                <DialogContent className="bg-white text-gray-900">
                    <DialogHeader>
                        <DialogTitle>Alterar Senha</DialogTitle>
                        <DialogDescription>Crie uma nova senha forte para sua conta.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-4">
                        <div>
                            <label htmlFor="senhaAtual">Senha Atual</label>
                            <Input id="senhaAtual" name="senhaAtual" type="password" value={passwordData.senhaAtual} onChange={handleChange} required />
                        </div>
                        <div>
                            <label htmlFor="novaSenha">Nova Senha</label>
                            <Input id="novaSenha" name="novaSenha" type="password" value={passwordData.novaSenha} onChange={handleChange} required />
                        </div>
                        <div>
                            <label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</label>
                            <Input id="confirmarNovaSenha" name="confirmarNovaSenha" type="password" value={passwordData.confirmarNovaSenha} onChange={handleChange} required />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
                            <Button type="submit" disabled={savingPassword}>{savingPassword ? 'Salvando...' : 'Salvar Senha'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}