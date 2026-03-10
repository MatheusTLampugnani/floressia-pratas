import { useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Card, Alert, Spinner, Badge, Table, Tabs, Tab } from 'react-bootstrap';
import { FaUser, FaBoxOpen, FaSignOutAlt, FaMapMarkerAlt, FaTruck, FaPlus, FaTrash } from 'react-icons/fa';
import { supabase } from '../supabase';
import { useNavigate, Link } from 'react-router-dom';

export default function MinhaConta() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCadastro, setNomeCadastro] = useState('');
  const [authMsg, setAuthMsg] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [perfil, setPerfil] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilMsg, setPerfilMsg] = useState(null);

  const [modoAddEndereco, setModoAddEndereco] = useState(false);
  const [novoEndereco, setNovoEndereco] = useState({ titulo: '', cep: '', endereco: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);

  const [pedidos, setPedidos] = useState([]);

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
    
    setLoading(false);
  }

  // --- FUNÇÕES DE AUTENTICAÇÃO ---
  async function handleAuth(e) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthMsg(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: { data: { nome: nomeCadastro } } 
        });
        if (error) throw error;
        setAuthMsg({ tipo: 'success', texto: 'Conta criada! Faça login para continuar.' });
        setIsLogin(true);
      }
    } catch (error) {
      setAuthMsg({ tipo: 'danger', texto: error.message.includes('Invalid login') ? 'E-mail ou senha incorretos.' : 'Erro ao processar. Tente novamente.' });
    } finally {
      setAuthLoading(false);
    }
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

  // --- API DE CEP ---
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

  if (loading) return <div className="text-center py-5 my-5"><Spinner animation="border" /></div>;

  // TELA DE LOGIN / CADASTRO
  if (!session) {
    return (
      <Container className="py-5" style={{ maxWidth: '500px' }}>
        <div className="text-center mb-4">
          <h2 style={{fontFamily: 'Playfair Display'}}>{isLogin ? 'Acesse sua Conta' : 'Criar Nova Conta'}</h2>
          <p className="text-muted">{isLogin ? 'Acompanhe seus pedidos e gerencie seus endereços.' : 'Junte-se a nós e brilhe com a Floréssia Pratas.'}</p>
        </div>

        <Card className="border-0 shadow-sm rounded-0 p-4">
          {authMsg && <Alert variant={authMsg.tipo} className="rounded-0">{authMsg.texto}</Alert>}
          <Form onSubmit={handleAuth}>
            {!isLogin && (
              <Form.Group className="mb-3">
                <Form.Label className="small fw-bold">Nome Completo</Form.Label>
                <Form.Control type="text" className="rounded-0" required value={nomeCadastro} onChange={e => setNomeCadastro(e.target.value)} />
              </Form.Group>
            )}
            <Form.Group className="mb-3">
              <Form.Label className="small fw-bold">E-mail</Form.Label>
              <Form.Control type="email" className="rounded-0" required value={email} onChange={e => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label className="small fw-bold">Senha</Form.Label>
              <Form.Control type="password" className="rounded-0" required value={password} onChange={e => setPassword(e.target.value)} minLength={6} />
            </Form.Group>
            <Button variant="dark" type="submit" className="w-100 rounded-0 py-2 text-uppercase letter-spacing-1 mb-3" disabled={authLoading}>
              {authLoading ? <Spinner size="sm" animation="border" /> : (isLogin ? 'Entrar' : 'Cadastrar')}
            </Button>
            <div className="text-center">
              <Button variant="link" className="text-muted text-decoration-none small" onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Não tem conta? Crie uma aqui.' : 'Já tem conta? Faça login.'}
              </Button>
            </div>
          </Form>
        </Card>
      </Container>
    );
  }

  // TELA DA CONTA DO CLIENTE LOGADO
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
        
        {/* MEUS PEDIDOS */}
        <Tab eventKey="pedidos" title={<><FaBoxOpen className="me-2"/> Meus Pedidos</>}>
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
                    <th>Rastreio</th>
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
                          pedido.status === 'Enviado' ? 'success' : 
                          pedido.status === 'Em Produção' ? 'warning' : 'secondary'
                        } className="rounded-pill px-3 py-2 fw-normal">
                          {pedido.status}
                        </Badge>
                      </td>
                      <td>
                        {pedido.codigo_rastreio ? (
                          <div className="d-flex align-items-center gap-2 text-primary fw-bold font-monospace">
                            <FaTruck /> {pedido.codigo_rastreio}
                          </div>
                        ) : (
                          <span className="text-muted small">Aguardando envio</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        </Tab>

        {/* MEUS DADOS E ENDEREÇOS */}
        <Tab eventKey="dados" title={<><FaUser className="me-2"/> Meus Dados</>}>
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
    </Container>
  );
}