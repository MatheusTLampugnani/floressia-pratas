import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert, Badge, Modal, Nav, Tab } from 'react-bootstrap';
import { useNavigate, Link } from 'react-router-dom';
import { FaBoxOpen, FaHeart, FaMapMarkerAlt, FaUserEdit, FaSignOutAlt, FaArrowLeft, FaCheckCircle, FaCopy, FaTruck, FaExclamationTriangle } from 'react-icons/fa';
import { supabase } from '../supabase';

export default function MinhaConta() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  const [perfil, setPerfil] = useState({ nome: '', telefone: '' });
  const [pedidos, setPedidos] = useState([]);
  const [enderecos, setEnderecos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  const [activeTab, setActiveTab] = useState('pedidos');
  const [msgSucesso, setMsgSucesso] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({ titulo: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [buscandoCep, setBuscandoCep] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ titulo: '', mensagem: '', acao: null });

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/login');
      return;
    }

    setUser(session.user);

    const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', session.user.id).single();
    if (perfilData) setPerfil(perfilData);

    const { data: pedidosData } = await supabase.from('pedidos').select('*, itens_pedido(*)').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (pedidosData) setPedidos(pedidosData);

    const { data: endData } = await supabase.from('enderecos').select('*').eq('user_id', session.user.id).order('id', { ascending: false });
    if (endData) setEnderecos(endData);

    const { data: favData } = await supabase.from('favoritos').select('*, produtos(*)').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (favData) setFavoritos(favData);

    setLoading(false);
  }

  async function handleSair() {
    await supabase.auth.signOut();
    navigate('/');
  }

  async function atualizarPerfil(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const { error } = await supabase.from('perfis').upsert({ id: user.id, nome: perfil.nome, telefone: perfil.telefone });
      if (error) throw error;
      setMsgSucesso('Seus dados foram atualizados com sucesso!');
      setTimeout(() => setMsgSucesso(''), 4000);
    } catch (err) {
      alert('Erro ao atualizar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  async function buscarCep() {
    const cepLimpo = novoEndereco.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;
    
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setNovoEndereco(prev => ({
          ...prev, endereco: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf
        }));
      }
    } catch (err) {
      console.error("Erro no CEP");
    } finally {
      setBuscandoCep(false);
    }
  }

  async function salvarEndereco(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const { error } = await supabase.from('enderecos').insert([{ ...novoEndereco, user_id: user.id }]);
      if (error) throw error;
      
      const { data } = await supabase.from('enderecos').select('*').eq('user_id', user.id).order('id', { ascending: false });
      setEnderecos(data);
      setShowEndModal(false);
      setNovoEndereco({ titulo: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      setMsgSucesso('Endereço adicionado com sucesso!');
      setTimeout(() => setMsgSucesso(''), 4000);
    } catch (err) {
      alert("Erro ao salvar endereço.");
    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusaoEndereco(id) {
    setConfirmData({
      titulo: 'Excluir Endereço',
      mensagem: 'Tem certeza que deseja excluir este endereço de entrega?',
      acao: async () => {
        await supabase.from('enderecos').delete().eq('id', id);
        setEnderecos(enderecos.filter(e => e.id !== id));
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  }

  async function removerFavorito(produtoId) {
    await supabase.from('favoritos').delete().eq('user_id', user.id).eq('produto_id', produtoId);
    setFavoritos(favoritos.filter(f => f.produto_id !== produtoId));
  }

  const getStatusColor = (status) => {
    if (status === 'Entregue') return 'success';
    if (status === 'Enviado') return 'primary';
    if (status === 'Cancelado') return 'danger';
    if (status === 'Em Separação') return 'warning';
    return 'secondary';
  };

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" variant="dark" /></div>;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      <style>{`
        .account-nav .nav-link { color: #6c757d; border-radius: 0; padding: 12px 20px; transition: all 0.2s; font-weight: 500; font-size: 0.9rem; letter-spacing: 1px; text-transform: uppercase;}
        .account-nav .nav-link:hover { background-color: #f8f9fa; color: #212529; }
        .account-nav .nav-link.active { background-color: #212529; color: #fff; }
        .copy-btn { cursor: pointer; transition: opacity 0.2s; }
        .copy-btn:hover { opacity: 0.7; }
        .modal-backdrop.show { opacity: 0.7; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); background-color: #000; }

        @media (max-width: 768px) {
          .mobile-title { font-size: 1.8rem !important; }
          .nav-pills-mobile { flex-wrap: nowrap !important; overflow-x: auto !important; white-space: nowrap !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; border-bottom: 1px solid #dee2e6; margin-bottom: 15px; padding-bottom: 0px !important;}
          .nav-pills-mobile::-webkit-scrollbar { display: none; }
          .account-nav .nav-link { padding: 12px 16px !important; font-size: 0.85rem !important; background: transparent !important; border-bottom: 2px solid transparent !important; color: #6c757d !important;}
          .account-nav .nav-link.active { color: #000 !important; border-bottom: 2px solid #000 !important; font-weight: bold;}
          .pedido-header-mobile { flex-direction: column; align-items: flex-start !important; gap: 8px; }
          .pedido-card-body { padding: 16px 12px !important; }
          .text-mobile-sm { font-size: 0.8rem !important; }
          .btn-mobile-full { width: 100% !important; margin-top: 10px; }
        }
      `}</style>

      <div className="bg-white border-bottom shadow-sm py-3 mb-4">
        <Container className="d-flex justify-content-between align-items-center">
          <Link to="/" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.1rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> <span className="d-none d-sm-inline">Voltar à Loja</span>
          </Link>
          {user?.email === 'floressiapratas@gmail.com' && (
            <Button as={Link} to="/admin" variant="outline-dark" size="sm" className="rounded-0 fw-bold letter-spacing-1">PAINEL ADMIN</Button>
          )}
        </Container>
      </div>

      <Container>
        <div className="text-center mb-4">
          <h2 className="mobile-title" style={{fontFamily: 'Playfair Display'}}>Minha Conta</h2>
          <div style={{ width: '50px', height: '2px', backgroundColor: '#212529', margin: '0 auto' }}></div>
          <p className="text-muted small mt-2">Bem-vinda de volta, {perfil.nome?.split(' ')[0] || user?.email}!</p>
        </div>

        {msgSucesso && <Alert variant="success" className="rounded-0 text-center fw-bold shadow-sm d-flex justify-content-center align-items-center gap-2"><FaCheckCircle /> {msgSucesso}</Alert>}

        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Row className="gy-4">
            
            <Col lg={3}>
              <Card className="border-0 shadow-sm rounded-0 h-100 bg-white p-0 p-lg-2">
                <Nav variant="pills" className="flex-lg-column account-nav nav-pills-mobile gap-1 w-100 m-0">
                  <Nav.Item>
                    <Nav.Link eventKey="pedidos" className="d-flex align-items-center gap-2"><FaBoxOpen /> Pedidos</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="favoritos" className="d-flex align-items-center gap-2"><FaHeart /> Favoritos</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="enderecos" className="d-flex align-items-center gap-2"><FaMapMarkerAlt /> Endereços</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="dados" className="d-flex align-items-center gap-2"><FaUserEdit /> Dados</Nav.Link>
                  </Nav.Item>
                  <div className="border-top my-2 d-none d-lg-block"></div>
                  <Nav.Item className="mt-lg-auto d-none d-lg-block">
                    <Button variant="link" onClick={handleSair} className="text-danger text-decoration-none d-flex align-items-center gap-2 w-100 text-start px-3 py-2 fw-bold" style={{fontSize: '0.9rem'}}>
                      <FaSignOutAlt /> Sair da Conta
                    </Button>
                  </Nav.Item>
                </Nav>
              </Card>
            </Col>

            <Col lg={9}>
              <Tab.Content>
                
                <Tab.Pane eventKey="pedidos">
                  <h4 className="mb-4 d-none d-lg-block" style={{fontFamily: 'Playfair Display'}}>Histórico de Pedidos</h4>
                  {pedidos.length === 0 ? (
                    <div className="bg-white p-4 p-md-5 text-center border shadow-sm">
                      <FaBoxOpen size={40} className="text-muted opacity-25 mb-3" />
                      <h5 className="fw-normal text-muted fs-6 fs-md-5">Você ainda não fez nenhum pedido.</h5>
                      <Button as={Link} to="/" variant="dark" className="rounded-0 mt-3 px-4 w-100 w-sm-auto">Ir para as compras</Button>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3 gap-md-4">
                      {pedidos.map(pedido => (
                        <Card key={pedido.id} className="border-secondary-subtle shadow-sm rounded-0">
                          <Card.Header className="bg-light border-bottom border-secondary-subtle p-3 d-flex justify-content-between align-items-center pedido-header-mobile">
                            <div>
                              <span className="text-uppercase small fw-bold text-dark letter-spacing-1 d-block d-sm-inline">Pedido #{pedido.id}</span>
                              <span className="ms-0 ms-sm-3 text-muted small">{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <Badge bg={getStatusColor(pedido.status)} className="rounded-0 px-2 px-md-3 py-2 fw-normal letter-spacing-1">{pedido.status}</Badge>
                          </Card.Header>
                          
                          <Card.Body className="p-4 pedido-card-body">
                            {pedido.codigo_rastreio && (
                              <Alert variant="primary" className="rounded-0 mb-4 p-3 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2 border-0 bg-primary bg-opacity-10">
                                <div>
                                  <strong className="d-block mb-1 text-primary"><FaTruck className="me-2"/> Rastreio dos Correios:</strong>
                                  <span className="font-monospace fs-5 text-dark bg-white px-2 py-1 border d-inline-block">{pedido.codigo_rastreio}</span>
                                </div>
                                <Button 
                                  variant="primary" size="sm" className="rounded-0 copy-btn btn-mobile-full" 
                                  onClick={() => { navigator.clipboard.writeText(pedido.codigo_rastreio); alert('Código copiado!'); }}
                                >
                                  <FaCopy className="me-1"/> Copiar
                                </Button>
                              </Alert>
                            )}

                            <Row className="gy-3">
                              <Col md={8}>
                                <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1">Itens da Compra</h6>
                                <ul className="list-unstyled mb-0 text-mobile-sm">
                                  {pedido.itens_pedido.map(item => (
                                    <li key={item.id} className="mb-2 d-flex justify-content-between align-items-center border-bottom pb-2">
                                      <div className="d-flex align-items-center gap-2">
                                        <span className="fw-bold bg-light border px-2 py-1 small">{item.quantidade}x</span>
                                        <span className="text-dark text-truncate" style={{maxWidth: '180px'}}>{item.nome_produto}</span>
                                        {item.tamanho && <Badge bg="secondary" className="rounded-0 small d-none d-sm-inline">Tam: {item.tamanho}</Badge>}
                                      </div>
                                      <span className="text-muted fw-bold">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
                                    </li>
                                  ))}
                                </ul>
                              </Col>
                              <Col md={4} className="d-flex flex-row flex-md-column justify-content-between align-items-center align-items-md-end pt-3 pt-md-0 border-top border-md-0 mt-3 mt-md-0">
                                <span className="text-uppercase text-muted small fw-bold letter-spacing-1">Total</span>
                                <h4 className="fw-bold text-success mb-0">R$ {pedido.total.toFixed(2).replace('.', ',')}</h4>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="favoritos">
                  <h4 className="mb-4 d-none d-lg-block" style={{fontFamily: 'Playfair Display'}}>Minha Lista de Desejos</h4>
                  {favoritos.length === 0 ? (
                    <div className="bg-white p-4 p-md-5 text-center border shadow-sm">
                      <FaHeart size={40} className="text-muted opacity-25 mb-3" />
                      <h5 className="fw-normal text-muted fs-6 fs-md-5">Você ainda não favoritou nenhuma joia.</h5>
                    </div>
                  ) : (
                    <Row className="g-2 g-md-3">
                      {favoritos.map(fav => (
                        <Col xs={6} md={4} key={fav.id}>
                          <Card className="h-100 shadow-sm border-0 position-relative rounded-0">
                            <button onClick={() => removerFavorito(fav.produto_id)} className="btn btn-dark btn-sm position-absolute top-0 end-0 m-2 z-1 rounded-circle p-0 d-flex align-items-center justify-content-center" style={{width:'30px', height:'30px'}} title="Remover">X</button>
                            <Link to={`/produto/${fav.produto_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                              <div className="bg-light" style={{ overflow: 'hidden', aspectRatio: '1/1' }}>
                                <Card.Img variant="top" src={fav.produtos.imagem_url || "https://placehold.co/300"} className="rounded-0 h-100 w-100 object-fit-cover" />
                              </div>
                              <Card.Body className="text-center p-2 p-md-3">
                                <Card.Title style={{fontFamily: 'Playfair Display'}} className="text-truncate mb-1 text-mobile-sm">{fav.produtos.nome}</Card.Title>
                                <span className="fw-bold text-success text-mobile-sm">R$ {fav.produtos.preco.toFixed(2).replace('.', ',')}</span>
                              </Card.Body>
                            </Link>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="enderecos">
                  <div className="d-flex justify-content-between align-items-center mb-3 mb-md-4">
                    <h4 className="mb-0 d-none d-lg-block" style={{fontFamily: 'Playfair Display'}}>Meus Endereços</h4>
                    <Button variant="dark" size="sm" className="rounded-0 fw-bold letter-spacing-1 ms-auto ms-lg-0" onClick={() => setShowEndModal(true)}>+ ADICIONAR ENDEREÇO</Button>
                  </div>
                  
                  {enderecos.length === 0 ? (
                    <Alert variant="warning" className="rounded-0 border-0 shadow-sm text-center small">Nenhum endereço cadastrado. Cadastre um para facilitar suas compras!</Alert>
                  ) : (
                    <Row className="g-3">
                      {enderecos.map(end => (
                        <Col md={6} key={end.id}>
                          <Card className="border border-secondary-subtle bg-white shadow-sm rounded-0 h-100">
                            <Card.Body className="p-3 p-md-4 d-flex flex-column">
                              <h6 className="fw-bold text-uppercase letter-spacing-1 mb-2 pb-2 border-bottom"><FaMapMarkerAlt className="text-muted me-2"/> {end.titulo || 'Casa'}</h6>
                              <p className="text-muted small mb-1 text-mobile-sm">{end.endereco}, Nº {end.numero}</p>
                              {end.complemento && <p className="text-muted small mb-1 text-mobile-sm">{end.complemento}</p>}
                              <p className="text-muted small mb-1 text-mobile-sm">{end.bairro}</p>
                              <p className="text-muted small mb-3 text-mobile-sm">{end.cidade} - {end.estado} / CEP: {end.cep}</p>
                              <Button variant="outline-danger" size="sm" className="rounded-0 mt-auto align-self-start text-mobile-sm" onClick={() => confirmarExclusaoEndereco(end.id)}>Excluir Endereço</Button>
                            </Card.Body>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Tab.Pane>

                <Tab.Pane eventKey="dados">
                  <h4 className="mb-4 d-none d-lg-block" style={{fontFamily: 'Playfair Display'}}>Meus Dados Pessoais</h4>
                  <Card className="border-0 shadow-sm rounded-0">
                    <Card.Body className="p-3 p-md-5">
                      <Form onSubmit={atualizarPerfil}>
                        <Form.Group className="mb-3 mb-md-4">
                          <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">E-mail de Login (Fixo)</Form.Label>
                          <Form.Control type="email" value={user?.email || ''} disabled className="bg-light rounded-0 border-secondary-subtle" />
                        </Form.Group>

                        <Row className="gy-3 mb-4">
                          <Col md={6}>
                            <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Nome Completo</Form.Label>
                            <Form.Control type="text" className="rounded-0 border-secondary-subtle" value={perfil.nome} onChange={e => setPerfil({ ...perfil, nome: e.target.value })} required />
                          </Col>
                          <Col md={6}>
                            <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">WhatsApp / Telefone</Form.Label>
                            <Form.Control type="text" className="rounded-0 border-secondary-subtle" value={perfil.telefone} onChange={e => setPerfil({ ...perfil, telefone: e.target.value })} placeholder="(00) 90000-0000" />
                          </Col>
                        </Row>

                        <Button variant="dark" type="submit" size="lg" className="rounded-0 text-uppercase fw-bold letter-spacing-1 mt-2 w-100 w-sm-auto" disabled={salvando}>
                          {salvando ? <Spinner animation="border" size="sm" /> : 'Salvar Alterações'}
                        </Button>
                      </Form>
                    </Card.Body>
                  </Card>
                </Tab.Pane>

              </Tab.Content>
            </Col>
          </Row>

          <div className="d-lg-none mt-5 pt-3 border-top text-center">
             <Button variant="outline-danger" onClick={handleSair} className="rounded-0 px-5 fw-bold bg-transparent">
               Sair da minha conta
             </Button>
          </div>

        </Tab.Container>

        <Modal show={showEndModal} onHide={() => setShowEndModal(false)} centered size="lg">
          <Modal.Header closeButton className="border-0 pb-0 pt-3 pt-md-4 px-3 px-md-4">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold fs-5 fs-md-4">Novo Endereço de Entrega</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-3 p-md-4">
            <Form onSubmit={salvarEndereco}>
              <Row className="gy-3 mb-3">
                <Col xs={12} md={4}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">CEP</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control type="text" className="rounded-0" placeholder="00000-000" value={novoEndereco.cep} onChange={e => setNovoEndereco({...novoEndereco, cep: e.target.value})} maxLength={9} required />
                    <Button variant="outline-dark" className="rounded-0" onClick={buscarCep} disabled={buscandoCep}>{buscandoCep ? <Spinner size="sm" animation="border"/> : 'Buscar'}</Button>
                  </div>
                </Col>
                <Col xs={12} md={8}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Identificação (Ex: Casa, Trabalho)</Form.Label>
                  <Form.Control type="text" className="rounded-0" value={novoEndereco.titulo} onChange={e => setNovoEndereco({...novoEndereco, titulo: e.target.value})} required />
                </Col>
              </Row>

              <Row className="gy-3 mb-3">
                <Col xs={8} md={9}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Rua / Avenida</Form.Label>
                  <Form.Control type="text" className="rounded-0 bg-light" value={novoEndereco.endereco} onChange={e => setNovoEndereco({...novoEndereco, endereco: e.target.value})} required />
                </Col>
                <Col xs={4} md={3}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Número</Form.Label>
                  <Form.Control type="text" className="rounded-0" value={novoEndereco.numero} onChange={e => setNovoEndereco({...novoEndereco, numero: e.target.value})} required />
                </Col>
              </Row>

              <Row className="gy-3 mb-4">
                <Col xs={12} md={4}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Complemento</Form.Label>
                  <Form.Control type="text" className="rounded-0" placeholder="Apto 101, Bloco B" value={novoEndereco.complemento} onChange={e => setNovoEndereco({...novoEndereco, complemento: e.target.value})} />
                </Col>
                <Col xs={12} md={3}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Bairro</Form.Label>
                  <Form.Control type="text" className="rounded-0 bg-light" value={novoEndereco.bairro} onChange={e => setNovoEndereco({...novoEndereco, bairro: e.target.value})} required />
                </Col>
                <Col xs={8} md={3}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">Cidade</Form.Label>
                  <Form.Control type="text" className="rounded-0 bg-light" value={novoEndereco.cidade} onChange={e => setNovoEndereco({...novoEndereco, cidade: e.target.value})} required />
                </Col>
                <Col xs={4} md={2}>
                  <Form.Label className="small fw-bold text-muted text-uppercase">UF</Form.Label>
                  <Form.Control type="text" className="rounded-0 bg-light" value={novoEndereco.estado} onChange={e => setNovoEndereco({...novoEndereco, estado: e.target.value})} maxLength={2} required />
                </Col>
              </Row>

              <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 pt-3 border-top">
                <Button variant="outline-secondary" className="rounded-0 px-4 w-100 w-sm-auto" onClick={() => setShowEndModal(false)}>Cancelar</Button>
                <Button variant="dark" type="submit" className="rounded-0 px-4 text-uppercase fw-bold letter-spacing-1 w-100 w-sm-auto" disabled={salvando}>
                  {salvando ? <Spinner size="sm" animation="border"/> : 'Salvar Endereço'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="text-danger fw-bold fs-4 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {confirmData.titulo}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2 pb-4 px-4">
            <p className="text-dark fs-5">{confirmData.mensagem}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4 pt-4 border-top border-secondary-subtle">
              <Button variant="outline-dark" className="rounded-0 px-4 w-100 w-sm-auto fw-bold" onClick={() => setShowConfirm(false)}>CANCELAR</Button>
              <Button variant="danger" className="rounded-0 px-4 fw-bold w-100 w-sm-auto shadow-sm" onClick={confirmData.acao}>SIM, EXCLUIR</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
}