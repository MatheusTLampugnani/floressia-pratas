import { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: senha,
    });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setLoading(false);
    } else {
      navigate('/admin');
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <Container style={{ maxWidth: '400px' }}>
        <div className="text-center mb-4">
          <Link to="/" className="text-muted text-decoration-none small d-inline-flex align-items-center mb-3">
            <FaArrowLeft className="me-2" /> Voltar para a loja
          </Link>
          <h2 style={{ fontFamily: 'Playfair Display' }}>Acesso Restrito</h2>
          <p className="text-muted">Área exclusiva para gestão da loja.</p>
        </div>

        <Card className="shadow-sm border-0 p-4">
          {erro && <Alert variant="danger" className="py-2 text-center">{erro}</Alert>}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="seu-email@exemplo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Senha</Form.Label>
              <Form.Control 
                type="password" 
                placeholder="••••••••" 
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required 
              />
            </Form.Group>

            <Button variant="dark" type="submit" className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2" disabled={loading}>
              {loading ? <Spinner size="sm" animation="border" /> : (
                <><FaLock size={14} /> Entrar no Painel</>
              )}
            </Button>
          </Form>
        </Card>

      </Container>
    </div>
  );
}