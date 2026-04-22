import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Modal, Spinner, Form, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBoxOpen, FaEye, FaTruck, FaMapMarkerAlt, FaUser, FaCheckCircle, FaWhatsapp, FaTags, FaUsers, FaSignOutAlt, FaStore, FaExclamationTriangle, FaTrash, FaClipboardList } from 'react-icons/fa';
import { supabase } from '../supabase';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  const [novoStatus, setNovoStatus] = useState('');
  const [novoRastreio, setNovoRastreio] = useState('');
  const [salvandoStatus, setSalvandoStatus] = useState(false);
  const [msgStatus, setMsgStatus] = useState(null);

  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriasLista, setCategoriasLista] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loadingCategoria, setLoadingCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ titulo: '', mensagem: '', acao: null });

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

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  async function carregarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('nome');
    if (data) setCategoriasLista(data);
  }

  function abrirModalCategorias() {
    setErroCategoria(null);
    carregarCategorias();
    setShowCategoriaModal(true);
  }

  async function handleAddCategoria(e) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setLoadingCategoria(true);
    setErroCategoria(null);

    try {
      const { error } = await supabase.from('categorias').insert([{ nome: novaCategoria.trim() }]);
      if (error) throw error;
      setNovaCategoria('');
      carregarCategorias(); 
    } catch (error) { setErroCategoria("Erro ao adicionar categoria. Talvez ela já exista."); } 
    finally { setLoadingCategoria(false); }
  }

  function confirmarExclusaoCategoria(id) {
    setConfirmData({
      titulo: 'Excluir Categoria',
      mensagem: 'Tem certeza que deseja excluir esta categoria? As peças que usam ela podem ficar sem categoria.',
      acao: async () => {
        await supabase.from('categorias').delete().eq('id', id);
        carregarCategorias();
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  }

  const getStatusColor = (status) => {
    if (status === 'Entregue') return 'success';
    if (status === 'Enviado') return 'primary';
    if (status === 'Cancelado') return 'danger';
    if (status === 'Em Separação') return 'warning';
    return 'dark';
  };

  return (
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      <style>{`
        .form-control:focus, .form-select:focus { border-color: #212529; box-shadow: none; background-color: #fff !important; }
        .admin-table tbody tr { transition: background-color 0.2s ease; }
        .admin-table tbody tr:hover { background-color: #f8f9fa; }
        .table-container { box-shadow: 0 8px 30px rgba(0,0,0,0.04); border: 1px solid #eaeaea; border-radius: 12px !important; overflow: hidden; }
        
        .horizontal-scroll { overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .horizontal-scroll::-webkit-scrollbar { display: none; }
        
        .admin-nav-link { color: #495057; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px; transition: all 0.2s ease; background: transparent; border: none; }
        .admin-nav-link:hover { background-color: #f1f3f5; color: #000; }
        
        .admin-nav-link-danger { color: #dc3545; font-weight: 600; text-decoration: none; padding: 8px 16px; border-radius: 6px; transition: all 0.2s ease; background: transparent; border: none; }
        .admin-nav-link-danger:hover { background-color: #fee2e2; color: #c92a2a; }

        .modal-backdrop.show { opacity: 0.7; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); background-color: #000; }
        .action-btn { transition: all 0.2s; border-radius: 6px !important;}
        .action-btn:hover { transform: translateY(-2px); }

        @media (max-width: 768px) {
          .admin-header-title { font-size: 1.6rem !important; }
          .nav-btn-mobile { flex: 1 0 auto; font-size: 0.85rem !important; }
          
          .table-mobile { font-size: 0.8rem !important; }
          .table-mobile th, .table-mobile td { padding: 10px 6px !important; vertical-align: middle; }
          .badge-mobile { font-size: 0.65rem !important; padding: 5px 6px !important; }
          .btn-acao-mobile { padding: 6px 10px !important; } 
          
          .modal-body-mobile { padding: 20px 15px !important; }
          .input-mobile { padding: 12px !important; font-size: 0.95rem !important; }
          .btn-mobile-full { width: 100% !important; margin-top: 10px; padding: 12px !important; }
          .modal-title-mobile { font-size: 1.3rem !important; }
        }
      `}</style>

      {/* --- CABEÇALHO --- */}
      <div className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1020 }}>
        <Container className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center py-3 gap-3">
          
          <div className="d-flex align-items-center flex-shrink-0" style={{ minWidth: '220px' }}>
            <Link to="/minha-conta" className="text-decoration-none text-dark d-flex align-items-center fw-bold text-nowrap" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem', transition: 'opacity 0.2s'}} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
              <FaArrowLeft className="me-2 fs-6 text-muted" /> Minha Conta
            </Link>
          </div>
          
          <div className="horizontal-scroll d-flex align-items-center justify-content-start justify-content-lg-center gap-2 w-100 pb-1 pb-lg-0 m-0">
            
            <Link to="/" className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded-2 text-uppercase fw-bold text-primary bg-primary bg-opacity-10 text-decoration-none flex-shrink-0 transition-all" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaStore size={14} /> Ver Loja
            </Link>

            <div className="vr d-none d-lg-block mx-2" style={{ backgroundColor: '#dee2e6', width: '2px', height: '24px' }}></div>

            <Link to="/admin" className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaClipboardList size={14} className="text-secondary opacity-75"/> Catálogo
            </Link>
            <button className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={abrirModalCategorias}>
              <FaTags size={14} className="text-secondary opacity-75"/> Categorias
            </button>
            <button className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link text-dark bg-light flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaBoxOpen size={14} className="text-dark"/> Pedidos
            </button>
            <Link to="/admin/fornecedores" className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaUsers size={14} className="text-secondary opacity-75"/> Fornecedores
            </Link>

            <div className="vr d-lg-none mx-1" style={{ backgroundColor: '#dee2e6', width: '2px', height: '24px' }}></div>
            <button className="d-flex d-lg-none align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link-danger flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={handleLogout}>
              <FaSignOutAlt size={14}/> Sair
            </button>
          </div>

          <div className="d-none d-lg-flex align-items-center justify-content-end flex-shrink-0" style={{ minWidth: '220px' }}>
            <button className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link-danger" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={handleLogout}>
              <FaSignOutAlt size={14}/> Sair
            </button>
          </div>

        </Container>
      </div>

      <Container className="pt-4 pt-md-5">
        <div className="mb-4">
          <h2 className="mb-0 admin-header-title text-dark fw-bold" style={{fontFamily: 'Playfair Display'}}>Gestão de Pedidos</h2>
          <p className="text-muted small mt-1 letter-spacing-1">{pedidos.length} pedidos registrados</p>
        </div>

        {/* LISTAGEM DE PEDIDOS */}
        <div className="bg-white table-container">
          {loading ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : (
            <div className="table-responsive horizontal-scroll">
              <Table className="mb-0 align-middle bg-white text-nowrap admin-table table-mobile">
                <thead className="bg-light border-bottom">
                  <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                    <th className="ps-2 ps-md-4 py-3 fw-bold border-0">Pedido</th>
                    <th className="py-3 fw-bold border-0">Data</th>
                    <th className="py-3 fw-bold border-0">Cliente</th>
                    <th className="py-3 fw-bold border-0 text-center">Status</th>
                    <th className="text-end pe-2 pe-md-4 py-3 fw-bold border-0">Ação</th>
                  </tr>
                </thead>
                <tbody className="border-top-0">
                  {pedidos.map(pedido => (
                    <tr key={pedido.id} className="border-bottom border-light">
                      <td className="ps-2 ps-md-4 py-3 fw-bold text-dark">#{pedido.id}</td>
                      <td className="py-3 text-muted">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="py-3">
                        <div className="fw-bold text-dark text-truncate" style={{maxWidth: '120px'}}>{pedido.perfis?.nome?.split(' ')[0] || 'Cliente'}</div>
                        <div className="small text-success fw-semibold mt-1">R$ {pedido.total.toFixed(2).replace('.', ',')}</div>
                      </td>
                      <td className="py-3 text-center">
                        <Badge bg={getStatusColor(pedido.status)} className="rounded-1 fw-normal px-2 py-1 shadow-sm badge-mobile">
                          {pedido.status}
                        </Badge>
                      </td>
                      <td className="text-end pe-2 pe-md-4 py-3">
                        <Button variant="light" size="sm" className="border border-secondary-subtle rounded-2 px-md-3 py-md-2 btn-acao-mobile action-btn shadow-sm text-dark d-inline-flex align-items-center justify-content-center" onClick={() => abrirDetalhes(pedido)}>
                          <FaEye /> <span className="d-none d-md-inline ms-2 fw-semibold">Abrir</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {pedidos.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-5">
                         <FaBoxOpen size={40} className="text-muted opacity-25 mb-3" />
                         <h5 className="text-muted">Nenhum pedido recebido.</h5>
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </div>

        {/* MODAL DE DETALHES DE PEDIDO */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <Modal.Header closeButton className="border-bottom pb-3 pt-4 px-4 bg-light rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold text-dark fs-3">
              Pedido <span className="text-muted">#{pedidoSelecionado?.id}</span>
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4 modal-body-mobile bg-white rounded-bottom-2">
            {loadingDetalhes ? (
              <div className="text-center py-4"><Spinner animation="border" /></div>
            ) : (
              <>
                <Row className="gy-4 mb-4">
                  <Col md={6}>
                    <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1 d-flex align-items-center gap-2"><FaUser/> Cliente</h6>
                    <div className="bg-light p-3 rounded-2 h-100 border-0">
                      <div className="fw-bold text-dark mb-1 fs-5">{pedidoSelecionado?.perfis?.nome || 'N/A'}</div>
                      <div className="text-muted small"><FaWhatsapp className="me-1 text-success"/> {pedidoSelecionado?.perfis?.telefone || 'Telefone não cadastrado'}</div>
                    </div>
                  </Col>

                  <Col md={6}>
                    <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1 d-flex align-items-center gap-2"><FaMapMarkerAlt/> Entrega</h6>
                    <div className="bg-light p-3 rounded-2 h-100 border-0">
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

                <div className="mb-4">
                  <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1 d-flex align-items-center gap-2"><FaTruck/> Controle de Envio</h6>
                  <div className="p-3 p-md-4 border border-secondary-subtle bg-white shadow-sm rounded-2">
                    {msgStatus && (
                      <Alert variant={msgStatus.tipo} className="rounded-2 py-2 small mb-3 d-flex align-items-center gap-2 fw-bold">
                        <FaCheckCircle /> {msgStatus.texto}
                      </Alert>
                    )}
                    <Form onSubmit={handleSalvarStatus}>
                      <Row className="gy-3 align-items-end">
                        <Col md={5}>
                          <Form.Label className="small fw-bold text-dark">Status do Pedido</Form.Label>
                          <Form.Select className="rounded-2 border-secondary-subtle input-mobile bg-light" value={novoStatus} onChange={e => setNovoStatus(e.target.value)}>
                            {listaStatus.map(status => <option key={status} value={status}>{status}</option>)}
                          </Form.Select>
                        </Col>
                        <Col md={4}>
                          <Form.Label className="small fw-bold text-dark">Código de Rastreio</Form.Label>
                          <Form.Control type="text" className="rounded-2 border-secondary-subtle input-mobile bg-light" placeholder="Ex: BR123456789BR" value={novoRastreio} onChange={e => setNovoRastreio(e.target.value)} />
                        </Col>
                        <Col md={3}>
                          <Button variant="dark" type="submit" className="w-100 rounded-2 fw-bold text-uppercase action-btn btn-mobile-full" disabled={salvandoStatus}>
                            {salvandoStatus ? <Spinner size="sm" animation="border" /> : 'Atualizar'}
                          </Button>
                        </Col>
                      </Row>
                    </Form>
                  </div>
                </div>

                <div>
                  <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1 d-flex align-items-center gap-2"><FaBoxOpen/> Resumo da Compra</h6>
                  <div className="border border-secondary-subtle rounded-2 bg-white overflow-hidden">
                    <ul className="list-group list-group-flush">
                      {itensPedido.map(item => (
                        <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2 border-bottom">
                          <div className="d-flex align-items-center gap-2">
                            <Badge bg="light" text="dark" className="border border-secondary-subtle font-monospace px-2">{item.quantidade}x</Badge>
                            <span className="text-dark small fw-semibold">{item.nome_produto}</span>
                            {item.tamanho && <span className="text-muted small ms-1">(Tam: {item.tamanho})</span>}
                          </div>
                          <span className="text-muted fw-bold small">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="bg-light p-3 d-flex justify-content-between align-items-center border-top border-secondary-subtle">
                      <span className="text-uppercase fw-bold text-muted small letter-spacing-1">Total Recebido</span>
                      <h4 className="mb-0 fw-bold text-success">R$ {pedidoSelecionado?.total?.toFixed(2).replace('.', ',')}</h4>
                    </div>
                  </div>
                </div>

              </>
            )}
          </Modal.Body>
        </Modal>

        {/* MODAL DE CATEGORIAS */}
        <Modal show={showCategoriaModal} onHide={() => setShowCategoriaModal(false)} centered>
          <Modal.Header closeButton className="border-bottom pb-3 bg-light rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="modal-title-mobile fw-bold">Gerenciar Categorias</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4 pb-4 modal-body-mobile bg-white rounded-bottom-2">
          
          {erroCategoria && (
            <Alert variant="danger" className="rounded-2 p-2 text-center small mb-3 fw-bold shadow-sm">
              <FaExclamationTriangle className="me-2"/> {erroCategoria}
            </Alert>
          )}

          <Form onSubmit={handleAddCategoria} className="d-flex flex-column flex-sm-row gap-2 mb-4 p-3 bg-light border border-secondary-subtle shadow-sm rounded-2">
            <Form.Control type="text" placeholder="Ex: Tornozeleiras" className="rounded-2 input-mobile border-secondary-subtle" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} required />
            <Button variant="dark" type="submit" className="rounded-2 px-4 fw-bold letter-spacing-1 action-btn shadow-sm" disabled={loadingCategoria}>
              {loadingCategoria ? <Spinner size="sm" animation="border" /> : 'ADICIONAR'}
            </Button>
          </Form>

          <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2">Categorias Ativas</h6>
          {categoriasLista.length === 0 ? (
            <p className="text-muted small">Nenhuma categoria cadastrada.</p>
          ) : (
            <ul className="list-group list-group-flush border border-secondary-subtle shadow-sm rounded-2 overflow-hidden">
              {categoriasLista.map(cat => (
                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
                  <span className="text-dark fw-bold" style={{fontSize: '0.95rem'}}>{cat.nome}</span>
                  <button onClick={() => confirmarExclusaoCategoria(cat.id)} className="btn btn-link text-danger p-2 text-decoration-none action-btn hover-danger"><FaTrash size={16} /></button>
                </li>
              ))}
            </ul>
          )}
          </Modal.Body>
        </Modal>

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