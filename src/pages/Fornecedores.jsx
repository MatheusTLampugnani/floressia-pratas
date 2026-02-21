import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Card, Badge, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 
import { FaEdit, FaTrash, FaArrowLeft, FaPlus } from 'react-icons/fa'; 
import { supabase } from '../supabase';

export default function Fornecedores() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [fornecedores, setFornecedores] = useState([]); 
  const [editingId, setEditingId] = useState(null); 

  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');

  useEffect(() => {
    fetchFornecedores();
  }, []);

  async function fetchFornecedores() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome', { ascending: true }); 
    if (data) setFornecedores(data);
  }

  function handleEdit(forn) {
    setEditingId(forn.id);
    setNome(forn.nome);
    setCodigo(forn.codigo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setNome('');
    setCodigo('');
  }

  async function handleDeletar(id) {
    if (window.confirm("Atenção: Tem certeza que quer excluir este fornecedor?")) {
      const { error } = await supabase.from('fornecedores').delete().eq('id', id);
      if (!error) {
        fetchFornecedores(); 
        setMensagem({ tipo: 'success', texto: 'Fornecedor excluído com sucesso.' });
      } else {
        setMensagem({ tipo: 'danger', texto: 'Erro ao excluir. Verifique se existem peças atreladas a este fornecedor.' });
      }
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      const dados = { nome, codigo };
      let error;

      if (editingId) {
        const { error: updateError } = await supabase.from('fornecedores').update(dados).eq('id', editingId);
        error = updateError;
        setMensagem({ tipo: 'success', texto: 'Fornecedor atualizado com sucesso!' });
      } else {
        const { error: insertError } = await supabase.from('fornecedores').insert([dados]);
        error = insertError;
        setMensagem({ tipo: 'success', texto: 'Novo fornecedor cadastrado!' });
      }

      if (error) throw error;
      fetchFornecedores();
      resetForm();

    } catch (error) {
      setMensagem({ tipo: 'danger', texto: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      {/* BARRA DE TOPO */}
      <div className="bg-white border-bottom shadow-sm py-3 mb-5">
        <Container>
          <Link to="/admin" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Produtos
          </Link>
        </Container>
      </div>

      <Container style={{ maxWidth: '800px' }}>
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{fontFamily: 'Playfair Display'}}>
            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          {editingId && (
            <Button variant="outline-secondary" className="rounded-0" onClick={resetForm}>
              Cancelar Edição
            </Button>
          )}
        </div>
        
        {mensagem && (
          <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-0 border-0 shadow-sm">
            {mensagem.texto}
          </Alert>
        )}

        {/* FORMULÁRIO MINIMALISTA */}
        <Card className="border-0 shadow-sm rounded-0 mb-5">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSalvar}>
              <Row className="gy-4 mb-5">
                <Col md={8}>
                  <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Nome da Empresa / Fornecedor</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="rounded-0 border-secondary-subtle py-2 fs-6" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                    placeholder="Ex: Aquila Joias" 
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Cód. (Prefixo)</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="rounded-0 border-secondary-subtle py-2 fs-6 fw-bold text-primary font-monospace" 
                    value={codigo} 
                    onChange={e => setCodigo(e.target.value)} 
                    required 
                    placeholder="Ex: 10" 
                  />
                </Col>
              </Row>
              
              <Button variant="dark" type="submit" size="lg" className="w-100 py-3 rounded-0 text-uppercase letter-spacing-1" style={{fontSize: '0.9rem'}} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : (editingId ? 'Atualizar Dados' : 'Cadastrar Fornecedor')}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* LISTA DE FORNECEDORES */}
        <div className="d-flex justify-content-between align-items-end mb-3 mt-5">
          <h4 className="mb-0" style={{fontFamily: 'Playfair Display'}}>Fornecedores Cadastrados</h4>
        </div>
        
        <Card className="border-0 shadow-sm rounded-0 overflow-hidden">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle bg-white text-nowrap">
              <thead className="bg-light">
                <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                  <th className="ps-4 py-3 fw-semibold" style={{ width: '120px' }}>Prefixo</th>
                  <th className="py-3 fw-semibold">Nome</th>
                  <th className="text-end pe-4 py-3 fw-semibold">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {fornecedores.map(forn => (
                  <tr key={forn.id} className={editingId === forn.id ? "bg-light" : ""}>
                    <td className="ps-4 py-3">
                      <Badge bg="light" text="dark" className="border rounded-0 px-3 py-2 fs-6 font-monospace">
                        {forn.codigo}
                      </Badge>
                    </td>
                    <td className="py-3 fw-bold text-dark fs-6">{forn.nome}</td>
                    <td className="text-end pe-4 py-3">
                      <Button variant="outline-dark" size="sm" className="rounded-0 px-3 me-2" onClick={() => handleEdit(forn)}>
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm" className="rounded-0 px-3 border-0" onClick={() => handleDeletar(forn.id)}>
                        <FaTrash />
                      </Button>
                    </td>
                  </tr>
                ))}
                {fornecedores.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center py-5 text-muted">
                      Nenhum fornecedor cadastrado ainda. Adicione o primeiro acima!
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

      </Container>
    </div>
  );
}