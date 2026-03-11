import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge, Table, Tabs, Tab, Modal } from 'react-bootstrap';
import { FaUser, FaBoxOpen, FaSignOutAlt, FaMapMarkerAlt, FaTruck, FaPlus, FaTrash, FaHeart, FaEye, FaFileInvoiceDollar, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { supabase } from '../supabase';
import { useNavigate, Link, Navigate } from 'react-router-dom';

export default function MinhaConta() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [perfil, setPerfil] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState(null);
  
  const [modoAddEndereco, setModoAddEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({ titulo: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  
  const [pedidos, setPedidos] = useState([]);
  const [favoritos, setFavoritos] = useState([]);

  const [showModalPedido, setShowModalPedido] = useState(false);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) carregarDadosDoCliente(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) carregarDadosDoCliente(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function carregarDadosDoCliente(userId) {
    setLoading(true);
    
    const { data: perfilData } = await supabase.from('perfis').select('*').eq('id', userId).single();
    if (perfilData) setPerfil(perfilData);

    const { data: endData } = await supabase.from('enderecos').select('*').eq('user_id', userId).order('id', { ascending: false });
    if (endData) setEnderecos(endData);

    const { data: pedidosData } = await supabase.from('pedidos').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (pedidosData) setPedidos(pedidosData);

    const { data: favData } = await supabase
      .from('favoritos')
      .select('*, produtos(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (favData) setFavoritos(favData);
    
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/');
  }

  // --- SALVAR DADOS PESSOAIS ---
  async function handleAtualizarPerfil(e) {
    e.preventDefault();
    setSalvandoPerfil(true);
    setPerfilMsg(null);

    try {
      const { error } = await supabase.from('perfis').update({
        nome: perfil.nome,
        telefone: perfil.telefone,
        cpf: perfil.cpf
      }).eq('id', session.user.id);

      if (error) throw error;
      setPerfilMsg({ tipo: 'success', texto: 'Dados pessoais atualizados!' });
    } catch (error) {
      setPerfilMsg({ tipo: 'danger', texto: 'Erro ao salvar dados.' });
    } finally {
      setSalvandoPerfil(false);
    }
  }

  // --- API DE CEP (ViaCEP) ---
  async function buscarCep(cepDigitado) {
    const cepLimpo = cepDigitado.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setNovoEndereco(prev => ({
            ...prev,
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          }));
        }
      } catch (err) { console.error("Erro ao buscar CEP"); }
    }
  }

  // --- ADICIONAR NOVO ENDEREÇO ---
  async function handleSalvarNovoEndereco(e) {
    e.preventDefault();
    setSalvandoEndereco(true);
    try {
      const { error } = await supabase.from('enderecos').insert([{
        user_id: session.user.id,
        ...novoEndereco
      }]);
      if (error) throw error;
      
      setNovoEndereco({ titulo: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
      setModoAddEndereco(false);
      carregarDadosDoCliente(session.user.id);
    } catch (error) {
      alert("Erro ao salvar endereço. Verifique os dados.");
    } finally {
      setSalvandoEndereco(false);
    }
  }

  // --- EXCLUIR ENDEREÇO ---
  async function handleExcluirEndereco(id) {
    if (window.confirm('Tem certeza que deseja excluir este endereço?')) {
      await supabase.from('enderecos').delete().eq('id', id);
      carregarDadosDoCliente(session.user.id);
    }
  }

  // --- REMOVER FAVORITO ---
  async function removerFavorito(produtoId) {
    try {
      await supabase.from('favoritos').delete().eq('user_id', session.user.id).eq('produto_id', produtoId);
      setFavoritos(prev => prev.filter(fav => fav.produto_id !== produtoId));
    } catch (error) {
      console.error("Erro ao remover favorito:", error);
    }
  }

  // --- FUNÇÕES DO MODAL DE PEDIDO ---
  async function abrirDetalhesPedido(pedido) {
    setPedidoSelecionado(pedido);
    setShowModalPedido(true);
    
    const { data } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido.id);
    if (data) setItensPedido(data);
  }

  const statusLista = ['Aguardando Pagamento', 'Pagamento Confirmado', 'Em Separação', 'Enviado', 'Entregue'];
  const stepIndex = pedidoSelecionado ? statusLista.indexOf(pedidoSelecionado.status) : 0;
  const isCancelado = pedidoSelecionado?.status === 'Cancelado';

  const iconesTimeline = [
    { label: 'Aguardando', icon: <FaFileInvoiceDollar /> },
    { label: 'Confirmado', icon: <FaCheckCircle /> },
    { label: 'Separando', icon: <FaBoxOpen /> },
    { label: 'Enviado', icon: <FaTruck /> },
    { label: 'Entregue', icon: <FaMapMarkerAlt /> }
  ];

  if (loading) return <div className="text-center py-5 my-5"><Spinner animation="border" /></div>;

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // TELA DA CONTA DO CLIENTE
  return (
    <Container className="py-5" style={{ maxWidth: '900px' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
        <div>
          <h2 style={{fontFamily: 'Playfair Display', margin: 0}}>Olá, {perfil?.nome?.split(' ')[0] || 'Cliente'}!</h2>
          <p className="text-muted mb-0">Bem-vindo(a) à sua área exclusiva.</p>
        </div>
        <div className="d-flex gap-2">
          {perfil?.is_admin && (
            <Button as={Link} to="/admin" variant="outline-primary" size="sm" className="rounded-0">Painel Admin</Button>
          )}
          <Button variant="outline-dark" size="sm" className="rounded-0 d-flex align-items-center gap-2" onClick={handleLogout}>
            <FaSignOutAlt /> Sair
          </Button>
        </div>
      </div>

      <Tabs defaultActiveKey="pedidos" className="mb-4 custom-tabs">
        
        {/* ABA: MEUS PEDIDOS */}
        <Tab eventKey="pedidos" title={<><FaBoxOpen className="me-2"/> Pedidos</>}>
          <Card className="border-0 shadow-sm rounded-0 p-4">
            {pedidos.length === 0 ? (
              <div className="text-center py-5">
                <FaBoxOpen size={40} className="text-muted mb-3 opacity-50" />
                <h5 className="text-muted">Você ainda não tem pedidos.</h5>
                <Button as={Link} to="/" variant="dark" className="mt-3 rounded-0 px-4">Explorar a Loja</Button>
              </div>
            ) : (
              <Table responsive hover className="align-middle text-nowrap">
                <thead className="bg-light">
                  <tr className="small text-uppercase text-muted">
                    <th>Pedido #</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(pedido => (
                    <tr key={pedido.id}>
                      <td className="fw-bold">#{pedido.id}</td>
                      <td>{new Date(pedido.created_at).toLocaleDateString('pt-BR')}</td>
                      <td>R$ {pedido.total.toFixed(2).replace('.', ',')}</td>
                      <td>
                        <Badge bg={
                          pedido.status === 'Cancelado' ? 'danger' : 
                          pedido.status === 'Entregue' ? 'success' : 'dark'
                        } className="rounded-0 fw-normal py-1 px-2">
                          {pedido.status}
                        </Badge>
                      </td>
                      <td>
                        <Button variant="outline-dark" size="sm" className="rounded-0 d-flex align-items-center gap-2" onClick={() => abrirDetalhesPedido(pedido)}>
                          <FaEye /> Detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Tab>

        {/* ABA: MEUS FAVORITOS */}
        <Tab eventKey="favoritos" title={<><FaHeart className="me-2"/> Favoritos</>}>
          <Card className="border-0 shadow-sm rounded-0 p-4">
            {favoritos.length === 0 ? (
              <div className="text-center py-5">
                <FaHeart size={40} className="text-muted mb-3 opacity-25" />
                <h5 className="text-muted">Sua lista de desejos está vazia.</h5>
                <p className="small text-secondary mb-4">Que tal dar uma olhadinha nas nossas peças?</p>
                <Button as={Link} to="/" variant="dark" className="rounded-0 px-4">Explorar a Loja</Button>
              </div>
            ) : (
              <Row className="g-3 g-md-4">
                {favoritos.map(fav => (
                  <Col xs={6} md={3} key={fav.id}>
                    <Card className="h-100 shadow-sm border-0 position-relative rounded-0">
                      <button 
                        onClick={() => removerFavorito(fav.produto_id)}
                        className="btn btn-link position-absolute top-0 end-0 m-2 z-1 p-1 text-decoration-none shadow-none"
                        style={{ color: '#dc3545', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '50%' }}
                        title="Remover dos favoritos"
                      >
                        <FaHeart size={18} />
                      </button>

                      <Link to={`/produto/${fav.produto_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <Card.Img 
                          variant="top" 
                          src={fav.produtos?.imagem_url || "https://placehold.co/300"} 
                          className="rounded-0" 
                          style={{ objectFit: 'cover', aspectRatio: '1/1' }} 
                        />
                        <Card.Body className="p-2 text-center">
                          <Card.Title className="text-truncate fs-6 mb-1" style={{fontFamily: 'Playfair Display'}}>
                            {fav.produtos?.nome}
                          </Card.Title>
                          <div className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>
                            R$ {fav.produtos?.preco?.toFixed(2).replace('.', ',')}
                          </div>
                        </Card.Body>
                      </Link>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        </Tab>

        {/* ABA: MEUS DADOS E ENDEREÇOS */}
        <Tab eventKey="dados" title={<><FaUser className="me-2"/> Configurações</>}>
          <Card className="border-0 shadow-sm rounded-0 p-4 mb-4">
            <h5 className="mb-4 fw-bold">Informações Pessoais</h5>
            {perfilMsg && <Alert variant={perfilMsg.tipo} className="rounded-0">{perfilMsg.texto}</Alert>}
            
            <Form onSubmit={handleAtualizarPerfil}>
              <Row className="gy-3 mb-3">
                <Col md={5}>
                  <Form.Label className="small fw-bold">Nome Completo</Form.Label>
                  <Form.Control type="text" className="rounded-0" value={perfil?.nome || ''} onChange={e => setPerfil({...perfil, nome: e.target.value})} required />
                </Col>
                <Col md={3}>
                  <Form.Label className="small fw-bold">CPF</Form.Label>
                  <Form.Control type="text" className="rounded-0" value={perfil?.cpf || ''} onChange={e => setPerfil({...perfil, cpf: e.target.value})} required placeholder="Apenas números" />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-bold">WhatsApp</Form.Label>
                  <Form.Control type="text" className="rounded-0" value={perfil?.telefone || ''} onChange={e => setPerfil({...perfil, telefone: e.target.value})} required placeholder="(XX) 99999-9999" />
                </Col>
              </Row>
              <div className="text-end">
                <Button variant="dark" type="submit" className="rounded-0 px-4" disabled={salvandoPerfil}>
                  {salvandoPerfil ? <Spinner size="sm" animation="border" /> : 'Salvar Dados'}
                </Button>
              </div>
            </Form>
          </Card>

          {/* SESSÃO DE ENDEREÇOS */}
          <Card className="border-0 shadow-sm rounded-0 p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold mb-0"><FaMapMarkerAlt className="text-muted me-2"/> Meus Endereços</h5>
              {!modoAddEndereco && (
                <Button variant="outline-dark" size="sm" className="rounded-0 d-flex align-items-center gap-1" onClick={() => setModoAddEndereco(true)}>
                  <FaPlus /> Adicionar
                </Button>
              )}
            </div>

            {/* LISTA DE ENDEREÇOS CADASTRADOS */}
            {!modoAddEndereco && (
              <Row className="g-3">
                {enderecos.length === 0 ? (
                  <Col xs={12}>
                    <div className="text-center p-4 border border-secondary-subtle bg-light text-muted">
                      Você ainda não tem nenhum endereço cadastrado.
                    </div>
                  </Col>
                ) : (
                  enderecos.map(end => (
                    <Col md={6} key={end.id}>
                      <div className="p-3 border border-secondary-subtle position-relative h-100 bg-light">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <strong className="text-uppercase letter-spacing-1">{end.titulo}</strong>
                          <button onClick={() => handleExcluirEndereco(end.id)} className="btn btn-link text-danger p-0 text-decoration-none">
                            <FaTrash size={14} />
                          </button>
                        </div>
                        <div className="small text-muted" style={{lineHeight: '1.6'}}>
                          {end.endereco}, {end.numero} <br/>
                          {end.complemento && <>{end.complemento} <br/></>}
                          {end.bairro} - {end.cidade}/{end.estado} <br/>
                          CEP: {end.cep}
                        </div>
                      </div>
                    </Col>
                  ))
                )}
              </Row>
            )}

            {/* FORMULÁRIO DE NOVO ENDEREÇO */}
            {modoAddEndereco && (
              <div className="p-4 border border-secondary-subtle bg-light">
                <h6 className="fw-bold mb-3 text-primary">Cadastrar Novo Endereço</h6>
                <Form onSubmit={handleSalvarNovoEndereco}>
                  <Row className="gy-3 mb-3">
                    <Col md={4}>
                      <Form.Label className="small fw-bold">Dar um nome (Ex: Casa, Trabalho)</Form.Label>
                      <Form.Control type="text" className="rounded-0 border-primary" value={novoEndereco.titulo} onChange={e => setNovoEndereco({...novoEndereco, titulo: e.target.value})} required placeholder="Casa da Mãe" />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small fw-bold">CEP</Form.Label>
                      <Form.Control type="text" className="rounded-0" value={novoEndereco.cep} 
                        onChange={e => {
                          const val = e.target.value;
                          setNovoEndereco({...novoEndereco, cep: val});
                          if(val.length >= 8) buscarCep(val);
                        }} 
                        required placeholder="Somente números" 
                      />
                    </Col>
                    <Col md={5}>
                      <Form.Label className="small fw-bold">Endereço (Rua/Av)</Form.Label>
                      <Form.Control type="text" className="rounded-0" value={novoEndereco.endereco} onChange={e => setNovoEndereco({...novoEndereco, endereco: e.target.value})} required />
                    </Col>
                  </Row>

                  <Row className="gy-3 mb-4">
                    <Col md={2}>
                      <Form.Label className="small fw-bold">Número</Form.Label>
                      <Form.Control type="text" className="rounded-0" value={novoEndereco.numero} onChange={e => setNovoEndereco({...novoEndereco, numero: e.target.value})} required />
                    </Col>
                    <Col md={4}>
                      <Form.Label className="small fw-bold">Complemento</Form.Label>
                      <Form.Control type="text" className="rounded-0" value={novoEndereco.complemento} onChange={e => setNovoEndereco({...novoEndereco, complemento: e.target.value})} placeholder="Apto, Bloco..." />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small fw-bold">Bairro</Form.Label>
                      <Form.Control type="text" className="rounded-0" value={novoEndereco.bairro} onChange={e => setNovoEndereco({...novoEndereco, bairro: e.target.value})} required />
                    </Col>
                    <Col md={3}>
                      <Form.Label className="small fw-bold">Cidade/UF</Form.Label>
                      <div className="d-flex gap-2">
                        <Form.Control type="text" className="rounded-0" value={novoEndereco.cidade} onChange={e => setNovoEndereco({...novoEndereco, cidade: e.target.value})} required placeholder="Cidade" />
                        <Form.Control type="text" className="rounded-0" style={{width: '60px'}} value={novoEndereco.estado} onChange={e => setNovoEndereco({...novoEndereco, estado: e.target.value})} required placeholder="UF" maxLength={2} />
                      </div>
                    </Col>
                  </Row>

                  <div className="d-flex justify-content-end gap-2">
                    <Button variant="outline-secondary" className="rounded-0" onClick={() => setModoAddEndereco(false)}>Cancelar</Button>
                    <Button variant="primary" type="submit" className="rounded-0 px-4" disabled={salvandoEndereco}>
                      {salvandoEndereco ? <Spinner size="sm" animation="border" /> : 'Salvar Endereço'}
                    </Button>
                  </div>
                </Form>
              </div>
            )}
          </Card>
        </Tab>
      </Tabs>

      {/* MODAL DE DETALHE DO PEDIDO*/}
      <Modal show={showModalPedido} onHide={() => setShowModalPedido(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold">
            Detalhes do Pedido <span className="text-muted">#{pedidoSelecionado?.id}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="pt-2 px-4 pb-4">
          
          {/* LINHA DO TEMPO (STATUS) */}
          <div className="bg-light p-4 mb-4 border border-secondary-subtle">
            <h6 className="text-uppercase small fw-bold text-muted mb-4 letter-spacing-1 text-center">Status de Entrega</h6>
            
            {isCancelado ? (
              <div className="text-center text-danger py-3">
                <FaTimesCircle size={40} className="mb-2" />
                <h5 className="fw-bold">Pedido Cancelado</h5>
                <p className="small mb-0">Este pedido foi cancelado e não será entregue.</p>
              </div>
            ) : (
              <div className="position-relative d-flex justify-content-between text-center mx-auto" style={{maxWidth: '500px'}}>
                <div className="position-absolute top-50 start-0 w-100 border-top border-2 border-secondary-subtle" style={{ zIndex: 0, transform: 'translateY(-50%)' }}></div>
                <div className="position-absolute top-50 start-0 border-top border-2 border-dark" style={{ zIndex: 0, transform: 'translateY(-50%)', width: `${(stepIndex / 4) * 100}%`, transition: 'width 0.5s ease-in-out' }}></div>
                {iconesTimeline.map((step, idx) => (
                  <div key={idx} className="position-relative bg-light px-2" style={{ zIndex: 1 }}>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center border border-2 mx-auto mb-2 transition-all ${idx <= stepIndex ? 'border-dark bg-dark text-white' : 'border-secondary-subtle bg-white text-muted'}`} style={{ width: '35px', height: '35px' }}>
                      {step.icon}
                    </div>
                    <div className={`small fw-bold d-none d-md-block ${idx <= stepIndex ? 'text-dark' : 'text-muted'}`} style={{fontSize: '0.7rem', maxWidth: '70px', lineHeight: '1.2'}}>
                      {step.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Rastreio */}
            {pedidoSelecionado?.codigo_rastreio && !isCancelado && (
              <div className="text-center mt-4 pt-3 border-top">
                <span className="small text-muted me-2">Código de Rastreio:</span>
                <Badge bg="dark" className="fs-6 py-2 px-3 font-monospace letter-spacing-1">{pedidoSelecionado.codigo_rastreio}</Badge>
              </div>
            )}
          </div>

          {/* LISTA DE ITENS */}
          <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1">Itens Comprados</h6>
          <div className="border border-secondary-subtle">
            <ul className="list-group list-group-flush">
              {itensPedido.map(item => (
                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-3">
                  <div>
                    <span className="fw-bold text-dark me-2">{item.quantidade}x</span> 
                    <span className="text-dark">{item.nome_produto}</span>
                    {item.tamanho && <Badge bg="secondary" className="ms-2 rounded-0">Tam: {item.tamanho}</Badge>}
                  </div>
                  <span className="text-muted fw-bold">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
                </li>
              ))}
            </ul>
            <div className="bg-light p-3 d-flex justify-content-between align-items-center border-top">
              <span className="text-uppercase fw-bold text-muted small">Total do Pedido</span>
              <h5 className="mb-0 fw-bold" style={{fontFamily: 'Playfair Display'}}>R$ {pedidoSelecionado?.total?.toFixed(2).replace('.', ',')}</h5>
            </div>
          </div>

        </Modal.Body>
      </Modal>

    </Container>
  );
}