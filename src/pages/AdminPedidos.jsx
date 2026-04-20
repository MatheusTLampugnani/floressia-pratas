import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Modal, Spinner, Form, Row, Col, Card, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaEye, FaTruck, FaMapMarkerAlt, FaUser, FaCheckCircle, FaWhatsapp } from 'react-icons/fa';
import { supabase } from '../supabase';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const [novoStatus, setNovoStatus] = useState('');
  const [novoRastreio, setNovoRastreio] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [msgStatus, setMsgStatus] = useState(null);

  const listaStatus = ['Aguardando Pagamento', 'Pagamento Confirmado', 'Em Separação', 'Enviado', 'Entregue', 'Cancelado'];

  useEffect(() => {
    carregarPedidos();
  }, []);

  async function carregarPedidos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, perfis(nome, telefone)')
      .order('created_at', { ascending: false });

    if (!error && data) setPedidos(data);
    setLoading(false);
  }

  async function abrirDetalhes(pedido) {
    setPedidoSelecionado(pedido);
    setNovoStatus(pedido.status || 'Aguardando Pagamento');
    setNovoRastreio(pedido.codigo_rastreio || '');
    setMsgStatus(null);
    setShowModal(true);
    setLoadingDetalhes(true);

    const { data } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido.id);
    if (data) setItensPedido(data);
    
    setLoadingDetalhes(false);
  }

  async function handleSalvarStatus(e) {
    e.preventDefault();
    setSalvandoStatus(true);
    setMsgStatus(null);

    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          status: novoStatus, 
          codigo_rastreio: novoRastreio.trim() === '' ? null : novoRastreio.trim() 
        })
        .eq('id', pedidoSelecionado.id);

      if (error) throw error;

      setPedidoSelecionado({ ...pedidoSelecionado, status: novoStatus, codigo_rastreio: novoRastreio });
      setPedidos(pedidos.map(p => p.id === pedidoSelecionado.id ? { ...p, status: novoStatus, codigo_rastreio: novoRastreio } : p));
      
      setMsgStatus({ tipo: 'success', texto: 'Status do pedido atualizado com sucesso!' });
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      setMsgStatus({ tipo: 'danger', texto: 'Erro ao salvar. Tente novamente.' });
    } finally {
      setSalvandoStatus(false);
    }
  }

  const getStatusColor = (status) => {
    if (status === 'Entregue') return 'success';
    if (status === 'Enviado') return 'primary';
    if (status === 'Cancelado') return 'danger';
    if (status === 'Em Separação') return 'warning';
    return 'dark';
  };

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      <style>{`
        @media (max-width: 768px) {
          .table-mobile { font-size: 0.8rem !important; }
          .table-mobile th, .table-mobile td { padding: 10px 8px !important; }
          .badge-mobile { font-size: 0.65rem !important; padding: 4px 6px !important; }
          .modal-body-mobile { padding: 15px !important; }
          .admin-header { flex-direction: column; align-items: flex-start !important; gap: 10px; }
        }
      `}</style>

      <div className="bg-white border-bottom shadow-sm py-3 mb-4 mb-md-5">
        <Container className="d-flex justify-content-between align-items-center admin-header">
          <Link to="/admin" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Voltar ao Catálogo
          </Link>
          <div className="d-flex gap-2">
            <Button as={Link} to="/" variant="outline-dark" size="sm" className="rounded-0">Ver Loja</Button>
          </div>
        </Container>
      </div>

      <Container>
        <div className="mb-4">
          <h2 className="mb-0" style={{fontFamily: 'Playfair Display'}}>Gestão de Pedidos</h2>
          <p className="text-muted small mt-1">{pedidos.length} pedidos registrados</p>
        </div>

        <Card className="border-0 shadow-sm rounded-0 overflow-hidden">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 align-middle bg-white text-nowrap table-mobile">
                <thead className="bg-light">
                  <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                    <th className="ps-3 ps-md-4 py-3 fw-semibold">Pedido</th>
                    <th className="py-3 fw-semibold">Data</th>
                    <th className="py-3 fw-semibold">Cliente</th>
                    <th className="py-3 fw-semibold">Status</th>
                    <th className="text-end pe-3 pe-md-4 py-3 fw-semibold">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(pedido => (
                    <tr key={pedido.id}>
                      <td className="ps-3 ps-md-4 py-2 py-md-3 fw-bold">#{pedido.id}</td>
                      <td className="py-2 py-md-3">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-2 py-md-3">
                        <div className="fw-bold text-dark">{pedido.perfis?.nome?.split(' ')[0] || 'Cliente'}</div>
                        <div className="small text-muted">R$ {pedido.total.toFixed(2).replace('.', ',')}</div>
                      </td>
                      <td className="py-2 py-md-3">
                        <Badge bg={getStatusColor(pedido.status)} className="rounded-0 fw-normal badge-mobile">
                          {pedido.status}
                        </Badge>
                      </td>
                      <td className="text-end pe-3 pe-md-4 py-2 py-md-3">
                        <Button variant="outline-dark" size="sm" className="rounded-0 px-2 px-md-3 d-inline-flex align-items-center gap-1" onClick={() => abrirDetalhes(pedido)}>
                          <FaEye /> <span className="d-none d-md-inline">Abrir</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-5 text-muted">Nenhum pedido recebido ainda.</td></tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold text-dark fs-3">
              Pedido <span className="text-muted">#{pedidoSelecionado?.id}</span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4 modal-body-mobile">
            {loadingDetalhes ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
              <>
                <Row className="gy-4 mb-4">
                  <Col md={6}>
                    <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2"><FaUser className="me-2"/> Cliente</h6>
                    <div className="bg-light p-3 border border-secondary-subtle h-100">
                      <div className="fw-bold text-dark mb-1 fs-5">{pedidoSelecionado?.perfis?.nome || 'N/A'}</div>
                      <div className="text-muted small mb-2"><FaWhatsapp className="me-1"/> {pedidoSelecionado?.perfis?.telefone || 'Telefone não cadastrado'}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2"><FaMapMarkerAlt className="me-2"/> Entrega</h6>
                    <div className="bg-light p-3 border border-secondary-subtle h-100">
                      <div className="text-muted small" style={{lineHeight: '1.6'}}>
                        {pedidoSelecionado?.endereco_entrega ? (
                          pedidoSelecionado.endereco_entrega
                        ) : (
                          <span className="text-danger">Endereço não registrado no sistema.</span>
                        )}
                      </div>
                    </div>
                  </Col>
                </Row>

                <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2"><FaTruck className="me-2"/> Controle de Envio</h6>
                <div className="p-3 p-md-4 border border-dark mb-4" style={{backgroundColor: '#f8f9fa'}}>
                  {msgStatus && (
                    <Alert variant={msgStatus.tipo} className="rounded-0 py-2 small mb-3 d-flex align-items-center gap-2">
                      <FaCheckCircle /> {msgStatus.texto}
                    </Alert>
                  )}
                  <Form onSubmit={handleSalvarStatus}>
                    <Row className="gy-3 align-items-end">
                      <Col md={5}>
                        <Form.Label className="small fw-bold text-dark">Status do Pedido</Form.Label>
                        <Form.Select className="rounded-0 border-secondary-subtle shadow-none bg-white" value={novoStatus} onChange={e => setNovoStatus(e.target.value)}>
                          {listaStatus.map(status => <option key={status} value={status}>{status}</option>)}
                        </Form.Select>
                      </Col>
                      <Col md={4}>
                        <Form.Label className="small fw-bold text-dark">Código de Rastreio</Form.Label>
                        <Form.Control type="text" className="rounded-0 border-secondary-subtle shadow-none bg-white" placeholder="Ex: BR123456789BR" value={novoRastreio} onChange={e => setNovoRastreio(e.target.value)} />
                      </Col>
                      <Col md={3}>
                        <Button variant="dark" type="submit" className="w-100 rounded-0 fw-bold text-uppercase" disabled={salvandoStatus}>
                          {salvandoStatus ? <Spinner size="sm" animation="border" /> : 'Atualizar'}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </div>

                <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2"><FaBoxOpen className="me-2"/> Resumo da Compra</h6>
                <div className="border border-secondary-subtle bg-white">
                  <ul className="list-group list-group-flush">
                    {itensPedido.map(item => (
                      <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                        <div>
                          <span className="fw-bold text-dark me-2">{item.quantidade}x</span> 
                          <span className="text-dark small">{item.nome_produto}</span>
                          {item.tamanho && <Badge bg="secondary" className="ms-2 rounded-0 small">Tam: {item.tamanho}</Badge>}
                        </div>
                        <span className="text-muted fw-bold small">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="bg-light p-3 d-flex justify-content-between align-items-center border-top">
                    <span className="text-uppercase fw-bold text-muted small">Total</span>
                    <h4 className="mb-0 fw-bold text-success">R$ {pedidoSelecionado?.total?.toFixed(2).replace('.', ',')}</h4>
                  </div>
                </div>
              </>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </div>
  );
}