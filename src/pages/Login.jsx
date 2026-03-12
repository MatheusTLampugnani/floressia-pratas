import { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabase';
import { FaArrowLeft } from 'react-icons/fa';

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) redirecionarUsuario(session.user.id);
    });
  }, []);

  async function redirecionarUsuario(userId) {
    const { data } = await supabase.from('perfis').select('is_admin').eq('id', userId).single();
    
    if (data?.is_admin) {
      navigate('/admin');
    } else {
      navigate('/minha-conta');
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await redirecionarUsuario(data.user.id);
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nome: nomeCadastro } }
        });
        if (error) throw error;
        setMsg({ tipo: 'success', texto: 'Conta criada com sucesso! Faça login para entrar.' });
        setIsLogin(true);
      }
    } catch (error) {
      setMsg({ tipo: 'danger', texto: error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : 'Erro ao processar. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-light min-vh-100 d-flex flex-column align-items-center justify-content-center py-5">
      <Container style={{ maxWidth: '500px' }}>
        
        <div className="mb-4 text-center">
          <Link to="/" className="text-decoration-none text-muted small d-inline-flex align-items-center mb-3">
            <FaArrowLeft className="me-2" /> Voltar para a loja
          </Link>
          <h2 style={{fontFamily: 'Playfair Display', fontSize: '2.5rem'}} className="fw-bold text-dark">
            {isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}
          </h2>
          <p className="text-muted">
            {isLogin ? 'Acesse sua conta para continuar.' : 'Junte-se a nós e brilhe com a Floréssia Pratas.'}
          </p>
        </div>

        <Card className="border-0 shadow-lg rounded-4 p-4 p-md-5">
          {msg && <Alert variant={msg.tipo} className="rounded-2">{msg.texto}</Alert>}
          
          <Form onSubmit={handleAuth}>
            {!isLogin && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold text-secondary">Nome Completo</Form.Label>
                <Form.Control type="text" className="rounded-2 py-2" required value={nomeCadastro} onChange={e => setNomeCadastro(e.target.value)} placeholder="Maria Silva" />
              </Form.Group>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold text-secondary">E-mail</Form.Label>
              <Form.Control type="email" className="rounded-2 py-2" required value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" />
            </Form.Group>
            
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold text-secondary">Senha</Form.Label>
              <Form.Control type="password" className="rounded-2 py-2" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} placeholder="Mínimo 6 caracteres" />
            </Form.Group>
            
            <Button variant="dark" type="submit" className="w-100 rounded-pill py-3 text-uppercase fw-bold letter-spacing-1 mb-4 shadow-sm" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : (isLogin ? 'Entrar na Conta' : 'Criar Minha Conta')}
            </Button>
            
            <div className="text-center border-top pt-4">
              <span className="text-muted small me-2">
                {isLogin ? 'Ainda não tem cadastro?' : 'Já possui uma conta?'}
              </span>
              <Button variant="link" className="text-dark fw-bold text-decoration-none p-0" onClick={() => { setIsLogin(!isLogin); setMsg(null); }}>
                {isLogin ? 'Crie uma aqui.' : 'Faça login.'}
              </Button>
            </div>
          </Form>
        </Card>
      </Container>
    </div>
  );
}