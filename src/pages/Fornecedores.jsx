import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Badge, Row, Col, Card, Modal } from 'react-bootstrap';
import { Link } from 'react-router-dom'; 
import { FaEdit, FaTrash, FaArrowLeft, FaExclamationTriangle } from 'react-icons/fa'; 
import { supabase } from '../supabase';

export default function Fornecedores() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [fornecedores, setFornecedores] = useState([]); 
  const [editingId, setEditingId] = useState(null); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ titulo: '', mensagem: '', acao: null });

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

  function confirmarExclusaoFornecedor(id) {
    setConfirmData({
      titulo: 'Excluir Fornecedor',
      mensagem: 'Atenção: Tem certeza que quer excluir este fornecedor?',
      acao: async () => {
        const { error } = await supabase.from('fornecedores').delete().eq('id', id);
        if (!error) {
          fetchFornecedores(); 
          setMensagem({ tipo: 'success', texto: 'Fornecedor excluído com sucesso.' });
        } else {
          setMensagem({ tipo: 'danger', texto: 'Erro ao excluir. Verifique se existem peças atreladas a este fornecedor.' });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
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
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      <style>{`
        .form-control:focus { border-color: #212529; box-shadow: none; background-color: #fff !important; }
        .admin-table tbody tr { transition: background-color 0.2s ease; }
        .admin-table tbody tr:hover { background-color: #f8f9fa; }
        .table-container { box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #eaeaea; border-radius: 12px !important; overflow: hidden; }
        
        .action-btn { transition: all 0.2s; border-radius: 6px !important;}
        .action-btn:hover { transform: translateY(-2px); }
        .modal-backdrop.show { opacity: 0.7; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); background-color: #000; }

        @media (max-width: 768px) {
          .admin-header-title { font-size: 1.6rem !important; }
          .table-mobile-font { font-size: 0.85rem !important; }
          .table-mobile-font th, .table-mobile-font td { padding: 12px 8px !important; vertical-align: middle; }
          .input-mobile { padding: 12px !important; font-size: 0.95rem !important; }
          .btn-mobile-full { width: 100% !important; font-size: 0.95rem !important; padding: 14px !important; letter-spacing: 1px; }
          .modal-body-mobile { padding: 20px 15px !important; }
          .modal-title-mobile { font-size: 1.3rem !important; }
          .col-prefix { width: 80px !important; } /* Diminui a largura da coluna no mobile */
        }
      `}</style>

      {/* BARRA DE TOPO */}
      <div className="bg-white border-bottom shadow-sm py-3 mb-4 mb-md-5 sticky-top" style={{ zIndex: 1020 }}>
        <Container>
          <Link to="/admin" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem', transition: 'opacity 0.2s'}} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Voltar ao Painel
          </Link>
        </Container>
      </div>

      <Container style={{ maxWidth: '800px' }}>
        
        {/* CABEÇALHO DA PÁGINA */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0 admin-header-title text-dark fw-bold" style={{fontFamily: 'Playfair Display'}}>
            {editingId ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          {editingId && (
            <Button variant="outline-secondary" size="sm" className="rounded-2" onClick={resetForm}>
              Cancelar
            </Button>
          )}
        </div>
        
        {mensagem && (
          <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-2 border-0 shadow-sm fw-bold">
            {mensagem.texto}
          </Alert>
        )}

        {/* FORMULÁRIO */}
        <Card className="border-0 shadow-sm rounded-2 mb-5">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSalvar}>
              <Row className="gy-4 mb-4">
                <Col md={8}>
                  <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Nome da Empresa / Fornecedor</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="rounded-2 border-secondary-subtle bg-light input-mobile" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                    placeholder="Ex: Aquila Joias" 
                  />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Cód. (Prefixo)</Form.Label>
                  <Form.Control 
                    type="text" 
                    className="rounded-2 border-secondary-subtle bg-light input-mobile fw-bold text-primary font-monospace" 
                    value={codigo} 
                    onChange={e => setCodigo(e.target.value)} 
                    required 
                    placeholder="Ex: 10" 
                  />
                </Col>
              </Row>
              
              <Button variant="dark" type="submit" size="lg" className="btn-mobile-full py-3 rounded-2 text-uppercase fw-bold letter-spacing-1 shadow-sm action-btn" disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : (editingId ? 'Atualizar Dados' : 'Cadastrar Fornecedor')}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* LISTA DE FORNECEDORES */}
        <div className="d-flex justify-content-between align-items-end mb-3 mt-5">
          <h4 className="mb-0 text-dark fw-bold" style={{fontFamily: 'Playfair Display'}}>Fornecedores Cadastrados</h4>
        </div>
        
        <div className="bg-white table-container">
          <div className="table-responsive">
            <Table className="mb-0 align-middle bg-white text-nowrap admin-table table-mobile-font">
              <thead className="bg-light border-bottom">
                <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                  <th className="ps-2 ps-md-4 py-3 fw-bold border-0 col-prefix" style={{ width: '120px' }}>Prefixo</th>
                  <th className="py-3 fw-bold border-0">Nome</th>
                  <th className="text-end pe-2 pe-md-4 py-3 fw-bold border-0">Gerenciar</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {fornecedores.map(forn => (
                  <tr key={forn.id} className={`border-bottom border-light ${editingId === forn.id ? "bg-light" : ""}`}>
                    <td className="ps-2 ps-md-4 py-3">
                      <Badge bg="light" text="dark" className="border border-secondary-subtle rounded-1 px-2 px-md-3 py-1 py-md-2 font-monospace shadow-sm">
                        {forn.codigo}
                      </Badge>
                    </td>
                    <td className="py-3 fw-bold text-dark">{forn.nome}</td>
                    <td className="text-end pe-2 pe-md-4 py-3">
                      <Button variant="light" size="sm" className="border border-secondary-subtle rounded-2 px-2 px-md-3 py-1 py-md-2 me-1 me-md-2 action-btn shadow-sm text-dark" onClick={() => handleEdit(forn)} title="Editar">
                        <FaEdit />
                      </Button>
                      <Button variant="outline-danger" size="sm" className="rounded-2 px-2 px-md-3 py-1 py-md-2 action-btn shadow-sm" onClick={() => confirmarExclusaoFornecedor(forn.id)} title="Excluir">
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
        </div>

        {/* MODAL DE CONFIRMAÇÃO */}
        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4 bg-white rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="text-danger fw-bold modal-title-mobile fs-3 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {confirmData.titulo}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2 pb-4 px-4 modal-body-mobile bg-white rounded-bottom-2">
            <p className="text-dark fs-5 mt-2">{confirmData.mensagem}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-end gap-3 mt-4 pt-4 border-top border-secondary-subtle">
              <Button variant="outline-dark" size="lg" className="rounded-2 px-4 w-100 w-sm-auto fw-bold" onClick={() => setShowConfirm(false)}>CANCELAR</Button>
              <Button variant="danger" size="lg" className="rounded-2 px-5 fw-bold w-100 w-sm-auto shadow-sm action-btn" onClick={confirmData.acao}>SIM, EXCLUIR</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
}