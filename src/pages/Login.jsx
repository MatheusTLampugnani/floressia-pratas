import { useState } from 'react';
import { Container, Form, Button, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaLock, FaArrowLeft } from 'react-icons/fa';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/admin'); 
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
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>E-mail</Form.Label>
              <Form.Control 
                type="email" 
                placeholder="admin@floressia.com" 
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

            <Button variant="dark" type="submit" className="w-100 mb-3 d-flex align-items-center justify-content-center gap-2">
              <FaLock size={14} /> Entrar no Painel
            </Button>
          </Form>
        </Card>

      </Container>
    </div>
  );
}