import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useParams, Navigate, useNavigate, useOutletContext } from 'react-router-dom';
import { Container, Navbar, Nav, Row, Col, Card, Button, Offcanvas, Badge, Spinner, Alert, Form, Modal } from 'react-bootstrap';
import { FaShoppingCart, FaWhatsapp, FaTrash, FaInstagram, FaTiktok, FaTruck, FaCreditCard, FaGift, FaGem, FaBarcode, FaLock, FaRegEnvelope, FaArrowLeft, FaUser, FaHeart, FaRegHeart, FaMapMarkerAlt, FaSearch, FaListUl } from 'react-icons/fa';
import { supabase } from './supabase';
import { CartProvider, useCart } from './context/CartContext';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Fornecedores from './pages/Fornecedores';
import MinhaConta from './pages/MinhaConta';
import AdminPedidos from './pages/AdminPedidos';
import logoMarca from './assets/banner-floressia.png';
import inauguracaoBanner from './assets/inauguracao-banner.png';

// --- CARD DO PRODUTO ---
function ProductCard({ product }) {
  const { addToCart } = useCart();
  const disponivel = product.em_estoque !== false;
  const isOnPromo = product.preco_antigo && product.preco < product.preco_antigo;
  const formatPrice = (price) => price.toFixed(2).replace('.', ',');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    verificarFavorito();
  }, [product.id]);

  async function verificarFavorito() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase.from('favoritos').select('*').eq('user_id', session.user.id).eq('produto_id', product.id).maybeSingle();
    if (data) setIsFavorite(true);
  }

  async function toggleFavorite(e) {
    e.preventDefault(); e.stopPropagation();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    try {
      if (isFavorite) {
        await supabase.from('favoritos').delete().eq('user_id', session.user.id).eq('produto_id', product.id);
        setIsFavorite(false);
      } else {
        await supabase.from('favoritos').insert([{ user_id: session.user.id, produto_id: product.id }]);
        setIsFavorite(true);
      }
    } catch (error) { console.error("Erro ao favoritar", error); }
  }
  
  return (
    <Col xs={6} md={4} lg={3} className="mb-3 mb-md-4 px-1 px-md-3">
      <Card className="h-100 shadow-sm border-0 position-relative product-card rounded-0">
        {isOnPromo && disponivel && (
          <Badge bg="danger" className="position-absolute top-0 start-0 m-1 m-md-2 rounded-0 z-1 promo-badge">
            PROMO
          </Badge>
        )}

        <button 
          onClick={toggleFavorite}
          className="btn btn-link position-absolute top-0 end-0 m-1 m-md-2 z-1 p-1 text-decoration-none shadow-none fav-btn"
          style={{ color: isFavorite ? '#dc3545' : '#6c757d', backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: '50%' }}
        >
          {isFavorite ? <FaHeart className="fav-icon" /> : <FaRegHeart className="fav-icon" />}
        </button>

        <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="product-image-container bg-light" style={{ overflow: 'hidden', opacity: disponivel ? 1 : 0.6 }}>
            <Card.Img 
              variant="top" 
              src={product.imagem_url || "https://placehold.co/300"} 
              className="product-img rounded-0"
              loading="lazy"
            />
          </div>
        </Link>

        <Card.Body className="d-flex flex-column text-center p-2 p-md-3">
          <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
             <Card.Title style={{fontFamily: 'Playfair Display'}} className="text-truncate product-title mb-1">
               {product.nome}
             </Card.Title>
          </Link>

          <Card.Text className="text-muted small text-truncate d-none d-md-block mb-2">{product.descricao}</Card.Text>
          
          <div className="mt-auto mb-2 mb-md-3">
            {isOnPromo ? (
              <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center gap-0 gap-lg-2">
                 <span className="text-muted text-decoration-line-through price-old">
                   R$ {formatPrice(product.preco_antigo)}
                 </span>
                 <span className="fw-bold text-success price-current">
                   R$ {formatPrice(product.preco)}
                 </span>
              </div>
            ) : (
              <span className="fw-bold price-current text-dark">
                 R$ {formatPrice(product.preco)}
              </span>
            )}
          </div>
          
          <Button 
            variant={disponivel ? "dark" : "secondary"} 
            onClick={() => disponivel && addToCart(product)} 
            className="w-100 rounded-0 text-uppercase fw-bold add-btn"
            disabled={!disponivel}
          >
            {disponivel ? 'Adicionar' : 'Esgotado'}
          </Button>
        </Card.Body>
      </Card>

      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title style={{fontFamily: 'Playfair Display'}}>Acesse sua conta</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pb-4 pt-2">
          <FaRegHeart size={40} className="text-danger mb-3 opacity-75" />
          <p className="text-muted mb-4 px-2">Faça login ou crie uma conta rapidinho para salvar suas joias favoritas!</p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <Button variant="outline-secondary" className="rounded-0 px-4" onClick={() => setShowLoginModal(false)}>Agora não</Button>
            <Button as={Link} to="/login" variant="dark" className="rounded-0 px-4" onClick={() => setShowLoginModal(false)}>Fazer Login</Button>
          </div>
        </Modal.Body>
      </Modal>
    </Col>
  );
}

// --- SACOLA DE COMPRAS ---
function ShoppingCart() {
  const { showCart, setShowCart, cartItems, addToCart, decreaseQuantity, removeFromCart, cartTotal } = useCart();
  const PHONE_NUMBER = "5564992641367"; 
  const navigate = useNavigate(); 
  const [finalizando, setFinalizando] = useState(false); 
  const [session, setSession] = useState(null);
  const [enderecos, setEnderecos] = useState([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState('');
  const [alerta, setAlerta] = useState(null);

  useEffect(() => {
    if (showCart) {
      setAlerta(null);
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session) buscarEnderecos(session.user.id);
        else setEnderecos([]);
      });
    }
  }, [showCart]);

  async function buscarEnderecos(userId) {
    const { data } = await supabase.from('enderecos').select('*').eq('user_id', userId).order('id', { ascending: false });
    if (data && data.length > 0) {
      setEnderecos(data);
      setEnderecoSelecionado(data[0].id.toString());
    } else setEnderecos([]);
  }

  const checkoutStore = async () => {
    if (cartItems.length === 0) return;
    setFinalizando(true);
    setAlerta(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setAlerta({ tipo: 'warning', texto: 'Acesse sua conta para finalizar o pedido.', botaoUrl: '/login', botaoTexto: 'Fazer Login' });
        setFinalizando(false); return;
      }
      if (enderecos.length === 0) {
        setAlerta({ tipo: 'warning', texto: 'Cadastre um endereço de entrega.', botaoUrl: '/minha-conta', botaoTexto: 'Cadastrar Endereço' });
        setFinalizando(false); return;
      }

      const endEscolhido = enderecos.find(e => e.id.toString() === enderecoSelecionado.toString());
      const enderecoFormatado = `${endEscolhido.endereco}, Nº ${endEscolhido.numero} ${endEscolhido.complemento ? '('+endEscolhido.complemento+')' : ''} - Bairro: ${endEscolhido.bairro}, ${endEscolhido.cidade}/${endEscolhido.estado} - CEP: ${endEscolhido.cep}`;

      const { data: pedidoData, error: pedidoError } = await supabase.from('pedidos').insert([{ user_id: session.user.id, total: cartTotal, endereco_entrega: enderecoFormatado }]).select().single();
      if (pedidoError) throw pedidoError;

      const itensParaInserir = cartItems.map(item => {
        const idReal = item.id.toString().split('-')[0];
        return { pedido_id: pedidoData.id, produto_id: isNaN(idReal) ? null : parseInt(idReal), nome_produto: item.nome, preco_unitario: item.preco, quantidade: item.quantity, tamanho: item.nome.includes('Tam:') ? item.nome.split('Tam: ')[1].replace(')', '') : null };
      });
      const { error: itensError } = await supabase.from('itens_pedido').insert(itensParaInserir);
      if (itensError) throw itensError;

      let message = `*Olá! Acabei de fazer o Pedido #${pedidoData.id} no site da Floréssia:*\n\n`;
      cartItems.forEach(item => { message += `• ${item.quantity}x ${item.nome}\n`; });
      message += `\n*Valor Total: R$ ${cartTotal.toFixed(2).replace('.', ',')}*`;
      message += `\n*Entrega em:* ${endEscolhido.titulo} (${endEscolhido.cidade}/${endEscolhido.estado})`;
      message += "\n\nAguardo instruções para pagamento e envio.";
      
      window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
      setShowCart(false);
    } catch (error) {
      console.error("Erro ao gerar pedido:", error);
      setAlerta({ tipo: 'danger', texto: 'Problema ao processar pedido. Tente novamente.' });
    } finally { setFinalizando(false); }
  };

  return (
    <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end" className="cart-offcanvas">
      <Offcanvas.Header closeButton className="border-bottom py-3">
        <Offcanvas.Title style={{ fontFamily: 'Playfair Display' }} className="fs-4 fw-bold">
          Sua Sacola ({cartItems.length})
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body className="d-flex flex-column p-0">
        {cartItems.length === 0 ? (
          <div className="text-center my-auto p-4">
            <FaShoppingCart size={50} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">Sua sacola está vazia</h5>
            <Button variant="dark" className="mt-3 rounded-0 px-4" onClick={() => setShowCart(false)}>Começar a Comprar</Button>
          </div>
        ) : (
          <>
            <div className="flex-grow-1 overflow-auto p-3">
              {cartItems.map(item => (
                <div key={item.id} className="d-flex align-items-center mb-3 pb-3 border-bottom position-relative">
                  <div className="flex-shrink-0 bg-light border" style={{ width: '70px', height: '70px' }}>
                    <img src={item.imagem_url || "https://placehold.co/100"} alt={item.nome} className="w-100 h-100 object-fit-cover" />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="mb-0 fw-bold text-truncate pe-2" style={{ maxWidth: '180px', fontSize: '0.9rem' }}>{item.nome}</h6>
                      <button onClick={() => removeFromCart(item.id)} className="btn btn-link text-danger p-0 m-0"><FaTrash size={14} /></button>
                    </div>
                    <p className="mb-2 text-muted mt-1" style={{ fontSize: '0.8rem' }}>R$ {item.preco.toFixed(2).replace('.', ',')}</p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center border rounded">
                        <button onClick={() => decreaseQuantity(item.id)} className="btn btn-sm px-2 py-0 border-end bg-white">-</button>
                        <span className="px-3 small fw-bold">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="btn btn-sm px-2 py-0 border-start bg-white">+</button>
                      </div>
                      <span className="fw-bold text-dark fs-6">R$ {(item.preco * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-light p-3 p-md-4 border-top mt-auto shadow-sm">
              {alerta && (
                <Alert variant={alerta.tipo} className="rounded-0 text-center shadow-sm p-3 mb-3">
                  <div className="small fw-bold mb-2">{alerta.texto}</div>
                  {alerta.botaoUrl && (
                    <Button variant="dark" size="sm" className="rounded-0 text-uppercase px-4" onClick={() => { setShowCart(false); navigate(alerta.botaoUrl); }}>
                      {alerta.botaoTexto}
                    </Button>
                  )}
                </Alert>
              )}

              {session && !alerta && (
                <div className="mb-3">
                  <small className="fw-bold text-dark d-block mb-1"><FaMapMarkerAlt className="text-muted me-1"/> Entregar em:</small>
                  {enderecos.length > 0 ? (
                    <Form.Select size="sm" className="rounded-0 border-secondary-subtle shadow-sm" value={enderecoSelecionado} onChange={e => setEnderecoSelecionado(e.target.value)}>
                      {enderecos.map(end => <option key={end.id} value={end.id}>{end.titulo} - {end.endereco}</option>)}
                    </Form.Select>
                  ) : (
                    <Button as={Link} to="/minha-conta" variant="outline-danger" size="sm" className="w-100 rounded-0" onClick={() => setShowCart(false)}>+ Cadastrar Endereço</Button>
                  )}
                </div>
              )}

              <div className="d-flex justify-content-between align-items-end mb-2">
                <span className="text-muted fw-bold">Subtotal</span>
                <h3 className="mb-0 fw-bold" style={{ fontFamily: 'Playfair Display' }}>R$ {cartTotal.toFixed(2).replace('.', ',')}</h3>
              </div>
              <small className="d-block text-muted mb-3 text-center" style={{fontSize: '0.7rem'}}>Frete calculado no WhatsApp</small>
              
              <Button variant="success" size="lg" className="w-100 rounded-0 d-flex align-items-center justify-content-center gap-2 text-white fw-bold py-2 py-md-3 shadow-sm" onClick={checkoutStore} disabled={finalizando} style={{ background: '#25D366', borderColor: '#25D366' }}>
                {finalizando ? <Spinner size="sm" animation="border" /> : <><FaWhatsapp size={20} /> FINALIZAR PEDIDO</>}
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// --- HEADER ---
function Header({ searchTerm, setSearchTerm }) {
  const { setShowCart, cartItems } = useCart();
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [categoriasLista, setCategoriasLista] = useState([]);
  const navigate = useNavigate();
  const cartSize = cartItems ? cartItems.length : 0;

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        buscarNomeUsuario(session.user.id);
        setUserEmail(session.user.email);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        buscarNomeUsuario(session.user.id);
        setUserEmail(session.user.email);
      } else {
        setUserName(null);
        setUserEmail(null);
      }
    });

    async function fetchCategorias() {
      const { data } = await supabase.from('categorias').select('*').order('nome');
      if (data) setCategoriasLista(data);
    }
    fetchCategorias();

    return () => subscription.unsubscribe();
  }, []);

  async function buscarNomeUsuario(userId) {
    const { data } = await supabase.from('perfis').select('nome').eq('id', userId).single();
    if (data && data.nome) setUserName(data.nome.split(' ')[0]);
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (window.location.pathname !== '/') navigate('/'); 
  };

  return (
    <header className="bg-white border-bottom shadow-sm sticky-top">
      <div className="py-2 py-md-3">
        <Container className="d-flex align-items-center justify-content-between gap-3 gap-md-5">
          
          <Link to="/" onClick={() => setSearchTerm('')} className="flex-shrink-0 text-decoration-none">
            <img src={logoMarca} alt="Floréssia Pratas" className="logo-img" />
          </Link>
          
          <div className="flex-grow-1 d-none d-md-flex align-items-center bg-light rounded-pill px-3 py-2 border border-secondary-subtle" style={{ maxWidth: '700px' }}>
            <Form.Control
              type="text"
              placeholder="Busque por joias, colares, anéis, pratas..."
              className="border-0 bg-transparent shadow-none px-2 w-100"
              value={searchTerm}
              onChange={handleSearch}
            />
            <Button variant="dark" className="rounded-pill p-0 d-flex align-items-center justify-content-center flex-shrink-0" style={{width: '35px', height: '35px'}}>
              <FaSearch size={14} />
            </Button>
          </div>

          <div className="d-flex align-items-center gap-3 gap-md-4 flex-shrink-0">
            
            {userEmail === 'admin@floressia.com' && (
              <Link to="/admin" className="text-dark d-flex align-items-center gap-2 text-decoration-none nav-icon-link" title="Painel Admin">
                <FaLock className="fs-4 text-danger" />
                <div className="d-none d-lg-flex flex-column lh-1 text-start">
                  <span className="small text-danger fw-bold" style={{fontSize: '0.7rem'}}>Área Restrita</span>
                  <strong className="text-uppercase letter-spacing-1 text-dark" style={{fontSize: '0.8rem'}}>Admin</strong>
                </div>
              </Link>
            )}

            <Link to="/minha-conta" className="text-dark d-flex align-items-center gap-2 text-decoration-none nav-icon-link">
              <FaUser className="fs-4 text-muted" />
              <div className="d-none d-lg-flex flex-column lh-1 text-start">
                <span className="small text-muted" style={{fontSize: '0.7rem'}}>Minha Conta</span>
                <strong className="text-uppercase letter-spacing-1 text-dark" style={{fontSize: '0.8rem'}}>
                  {userName ? `Olá, ${userName}` : 'Entrar / Cadastrar'}
                </strong>
              </div>
            </Link>

            <div className="vr d-none d-md-block opacity-25" style={{height: '45px'}}></div>

            <Button variant="link" className="text-dark position-relative p-0 border-0 nav-icon-link d-flex flex-column align-items-center text-decoration-none" onClick={() => setShowCart(true)}>
              <div className="position-relative">
                <FaShoppingCart className="fs-4 text-dark mb-1" />
                {cartSize > 0 && (
                  <Badge bg="danger" className="position-absolute top-0 start-100 translate-middle rounded-circle cart-badge px-2 py-1">
                    {cartSize}
                  </Badge>
                )}
              </div>
              <span className="d-none d-xl-block text-dark fw-bold" style={{fontSize: '0.65rem'}}>Sacola</span>
            </Button>
          </div>
        </Container>
      </div>

      <div className="d-md-none px-3 pb-3">
         <div className="d-flex align-items-center bg-light rounded-pill px-3 py-2 border border-secondary-subtle w-100">
            <Form.Control
              type="text"
              placeholder="O que você procura hoje?"
              className="border-0 bg-transparent shadow-none px-2 w-100"
              value={searchTerm}
              onChange={handleSearch}
              style={{fontSize: '0.9rem'}}
            />
            <FaSearch className="text-muted flex-shrink-0" size={16} />
          </div>
      </div>

      <div className="bg-dark text-white d-none d-md-block">
        <Container>
          <div className="d-flex align-items-center justify-content-center py-2 flex-wrap gap-2 gap-md-0" style={{fontSize: '0.85rem'}}>
            <Link to="/colecao/todos" className="text-white text-decoration-none fw-bold letter-spacing-1 d-flex align-items-center gap-2 me-md-4 departamento-link">
              <FaListUl /> TODAS AS JOIAS
            </Link>
            
            <div className="vr bg-light opacity-50 me-md-4 d-none d-md-block"></div>
            
            <div className="d-flex gap-3 gap-md-4 flex-wrap justify-content-center">
              <Link to="/colecao/destaques" className="text-white text-decoration-none letter-spacing-1 departamento-link">
                DESTAQUES
              </Link>
              <Link to="/colecao/novidades" className="text-warning fw-bold text-decoration-none letter-spacing-1 departamento-link">
                LANÇAMENTOS
              </Link>
              {categoriasLista.map(cat => (
                <Link 
                  key={cat.id} 
                  to={`/colecao/${cat.nome.toLowerCase()}`} 
                  className="text-light text-decoration-none text-uppercase letter-spacing-1 departamento-link"
                >
                  {cat.nome}
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </header>
  );
}

// --- PÁGINA INICIAL ---
function Store() {
  const [products, setProducts] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  const [categoriasLista, setCategoriasLista] = useState([]);
  const { searchTerm } = useOutletContext();

  useEffect(() => {
    fetchProducts();
    fetchCategorias();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('produtos').select('*').order('id', { ascending: false });
    if (data) setProducts(data);
  }

  async function fetchCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('nome');
    if (data) setCategoriasLista(data);
  }

  if (searchTerm && searchTerm.trim() !== '') {
    const termo = searchTerm.toLowerCase();
    const resultadosBusca = products.filter(p => 
      p.nome.toLowerCase().includes(termo) || 
      (p.descricao && p.descricao.toLowerCase().includes(termo)) ||
      (p.categoria && p.categoria.toLowerCase().includes(termo))
    );

    return (
      <Container className="py-5 min-vh-100 px-2 px-md-auto">
        <div className="text-center mb-4 mt-2 mt-md-4">
          <h2 className="section-title" style={{fontFamily: 'Playfair Display'}}>Resultados para "{searchTerm}"</h2>
          <div className="divider-custom"></div>
          <p className="text-muted small mt-2">{resultadosBusca.length} peças encontradas</p>
        </div>
        
        <Row className="g-1 g-md-4 mx-0">
          {resultadosBusca.map(product => <ProductCard key={product.id} product={product} />)}
          
          {resultadosBusca.length === 0 && (
            <div className="text-center py-5 w-100 text-muted d-flex flex-column align-items-center">
              <FaSearch size={40} className="mb-3 opacity-25" />
              <h5 className="fw-normal">Nenhuma joia encontrada com esse nome.</h5>
              <p className="small">Tente buscar por termos mais simples, como "Colar" ou "Prata".</p>
            </div>
          )}
        </Row>
      </Container>
    );
  }

  const destaques = products.filter(p => p.destaque === true || (p.preco_antigo && p.preco < p.preco_antigo));
  const produtosCatalogo = filtro === 'todos' ? products : products.filter(p => p.categoria === filtro);

  return (
    <>
      <div className="bg-light pb-2 mb-0 border-bottom">
        {/* <Container className="px-0 px-md-3">
          <div className="w-100 mb-2 mb-md-4">
            <Link to="/colecao/todos" className="d-block">
              <img src={inauguracaoBanner} alt="Grande Inauguração" className="w-100 img-fluid banner-home" />
            </Link>
          </div>
        </Container> */}
        
        <div className="d-md-none mt-2 mb-2">
          <div className="category-scroll d-flex gap-2 px-3 justify-content-start">
            <button className={`cat-btn ${filtro === 'todos' ? 'cat-btn-active' : ''}`} onClick={() => setFiltro('todos')} >TODOS</button>
            {categoriasLista.map(cat => {
              const catLowerCase = cat.nome.toLowerCase();
              return (
                <button key={cat.id} className={`cat-btn ${filtro === catLowerCase ? 'cat-btn-active' : ''}`} onClick={() => setFiltro(catLowerCase)} >
                  {cat.nome.toUpperCase()}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-light py-4 mb-4 mb-md-5 border-bottom d-none d-md-block">
        <Container>
          <Row className="gy-3 justify-content-center px-2">
            <Col xs={12} md={4} className="d-flex justify-content-center align-items-center gap-2 gap-md-3">
              <FaTruck size={22} className="text-dark flex-shrink-0" />
              <div>
                <h6 className="mb-0 fw-bold text-uppercase benefit-title">Envios Ágeis</h6>
                <small className="text-muted d-none d-md-block benefit-desc">Envios para todo Brasil</small>
              </div>
            </Col>
            <Col xs={12} md={4} className="d-flex justify-content-center align-items-center gap-2 gap-md-3">
              <FaCreditCard size={22} className="text-dark flex-shrink-0" />
              <div>
                <h6 className="mb-0 fw-bold text-uppercase benefit-title">Parcelamento</h6>
                <small className="text-muted d-none d-md-block benefit-desc">Parc. Min R$ 50</small>
              </div>
            </Col>
            <Col xs={12} md={4} className="d-flex justify-content-center align-items-center gap-2 gap-md-3">
              <FaGem size={22} className="text-dark flex-shrink-0" />
              <div>
                <h6 className="mb-0 fw-bold text-uppercase benefit-title">Prata 925</h6>
                <small className="text-muted d-none d-md-block benefit-desc">Garantia vitalícia</small>
              </div>
            </Col>
          </Row>
        </Container>
      </div>

      <Container className="px-2 px-md-auto mb-5">
        {filtro === 'todos' && destaques.length > 0 && (
          <div className="mb-5 mt-4 mt-md-0">
            <h3 className="text-center mb-3 mb-md-4 section-title">Destaques</h3>
            <div className="divider-custom mb-4"></div>
            <Row className="g-1 g-md-4 mx-0">
              {destaques.slice(0, 4).map(product => <ProductCard key={product.id} product={product} />)}
            </Row>
            {destaques.length > 4 && (
              <div className="text-center mt-3">
                <Button as={Link} to="/colecao/destaques" variant="outline-dark" className="px-4 py-2 rounded-0 text-uppercase btn-ver-mais">Ver Todos</Button>
              </div>
            )}
          </div>
        )}

        <div className="text-center mb-4 mt-5">
          <h2 className="section-title">
            {filtro === 'todos' ? 'Coleção Completa' : filtro.charAt(0).toUpperCase() + filtro.slice(1)}
          </h2>
          <div className="divider-custom"></div>
        </div>
        
        <Row className="g-1 g-md-4 mx-0">
          {produtosCatalogo.slice(0, 8).map(product => <ProductCard key={product.id} product={product} />)}
          {produtosCatalogo.length === 0 && (
            <div className="text-center py-5 w-100 text-muted">Nenhuma peça nesta categoria.</div>
          )}
        </Row>

        {produtosCatalogo.length > 8 && (
          <div className="text-center mt-4 mb-5">
            <Button as={Link} to={`/colecao/${filtro}`} variant="dark" className="px-5 py-2 rounded-0 text-uppercase fw-bold shadow-sm">Ver Mais Peças</Button>
          </div>
        )}
      </Container>
    </>
  );
}

// --- COLEÇÃO ESPECÍFICA ---
function CollectionPage() {
  const { tipo } = useParams(); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      const { data } = await supabase.from('produtos').select('*').order('id', { ascending: false });
      if (data) setProducts(data);
      setLoading(false);
    }
    fetchProducts();
    window.scrollTo(0, 0);
  }, [tipo]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;

  let filtered = products;
  let title = "Coleção Completa";
  if (tipo === 'destaques') { filtered = products.filter(p => p.destaque || (p.preco_antigo && p.preco < p.preco_antigo)); title = "Destaques"; }
  else if (tipo === 'novidades') { filtered = products.filter(p => p.novidade); title = "Lançamentos"; }
  else if (tipo !== 'todos') { filtered = products.filter(p => p.categoria === tipo); title = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`; }

  return (
    <Container className="py-4 px-2 px-md-auto min-vh-100">
      <Link to="/" className="btn btn-link text-secondary text-decoration-none mb-3 ps-2 d-inline-flex align-items-center small">
        <FaArrowLeft className="me-2" /> Voltar
      </Link>
      <div className="text-center mb-4">
        <h2 className="section-title">{title}</h2>
        <div className="divider-custom"></div>
        <p className="text-muted small">{filtered.length} peças encontradas</p>
      </div>
      <Row className="g-1 g-md-4 mx-0">
        {filtered.map(product => <ProductCard key={product.id} product={product} />)}
      </Row>
    </Container>
  );
}

// --- RODAPÉ ---
function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-top pt-4 pt-md-5 pb-3 mt-auto">
      <Container>
        <Row className="gy-4 text-center text-md-start">
          <Col lg={3} md={6}>
            <h6 className="fw-bold mb-3 footer-title">SIGA-NOS</h6>
            <div className="d-flex gap-2 justify-content-center justify-content-md-start">
              <a href="#" className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '35px', height: '35px' }}><FaInstagram size={18} /></a>
              <a href="#" className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '35px', height: '35px' }}><FaTiktok size={16} /></a>
            </div>
          </Col>
          <Col lg={3} md={6} xs={6}>
            <h6 className="fw-bold mb-3 footer-title">INSTITUCIONAL</h6>
            <ul className="list-unstyled text-muted small lh-lg">
              <li><a href="#" className="text-decoration-none text-secondary">Quem Somos</a></li>
              <li><a href="#" className="text-decoration-none text-secondary">Trocas e Devoluções</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6} xs={6}>
            <h6 className="fw-bold mb-3 footer-title">ATENDIMENTO</h6>
            <ul className="list-unstyled text-muted small lh-lg text-start text-md-start px-3 px-md-0">
              <li><FaWhatsapp className="me-1 text-success" /> (64) 99264-1367</li>
              <li className="text-truncate"><FaRegEnvelope className="me-1" /> floressia@gmail.com</li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
             <h6 className="fw-bold mb-3 footer-title">SEGURANÇA</h6>
             <div className="d-flex gap-2 mb-2 justify-content-center justify-content-md-start">
                 <FaCreditCard size={24} className="text-secondary"/><FaBarcode size={24} className="text-secondary"/><FaGem size={24} className="text-secondary"/>
             </div>
          </Col>
        </Row>
        <hr className="my-3 opacity-25" />
        <div className="text-center small text-muted">
          © {currentYear} <strong>Floréssia Pratas</strong>. Todos os direitos reservados.
        </div>
      </Container>
    </footer>
  );
}

// --- ESTRUTURA E ESTILOS CSS ---
function StoreLayout() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="d-flex flex-column min-vh-100">
      <style>{`
        body { background-color: #fafafa; }
        .letter-spacing-1 { letter-spacing: 1px; }
        .divider-custom { width: 50px; height: 2px; background-color: #212529; margin: 0 auto; }
        
        .category-scroll {
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 10px;
          padding-top: 5px;
          scroll-padding-left: 15px;
        }
        .category-scroll::-webkit-scrollbar { display: none; }

        .logo-img { max-height: 65px; width: auto; object-fit: contain; }
        
        .departamento-link { opacity: 0.8; transition: opacity 0.2s; }
        .departamento-link:hover { opacity: 1; text-decoration: underline !important; text-underline-offset: 4px; }
        
        .hover-danger:hover * { color: #dc3545 !important; }

        .cat-btn {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          color: #6c757d;
          border-radius: 50rem;
          padding: 8px 20px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          transition: all 0.3s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .cat-btn:hover { border-color: #212529; color: #212529; }
        .cat-btn.cat-btn-active {
          background-color: #212529;
          border-color: #212529;
          color: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }

        .product-image-container { position: relative; aspect-ratio: 1/1; width: 100%; display: flex; align-items: center; justify-content: center; }
        .product-img { object-fit: cover; width: 100%; height: 100%; transition: transform 0.3s ease; }
        

        @media (max-width: 768px) {
          .logo-img { max-height: 35px !important; }
          .nav-icon-link { padding: 5px !important; }
          .cart-badge { font-size: 0.55rem !important; transform: translate(-30%, -30%) !important; }
          .banner-home { min-height: 150px; object-fit: cover; }
          .section-title { font-size: 1.6rem !important; }
          .benefit-title { font-size: 0.7rem !important; }
          .footer-title { font-size: 0.8rem !important; }
          .product-card .card-body { padding: 8px !important; }
          .product-title { font-size: 0.8rem !important; margin-bottom: 4px !important; }
          .price-old { font-size: 0.65rem !important; }
          .price-current { font-size: 0.9rem !important; }
          .add-btn { font-size: 0.65rem !important; padding: 6px 0 !important; letter-spacing: 0px !important; }
          .promo-badge { font-size: 0.5rem !important; padding: 3px 5px !important; }
          .fav-btn { padding: 3px !important; margin: 4px !important; }
          .fav-icon { font-size: 14px !important; }
          .modal-body { padding: 15px !important; }
          .table-responsive { border: 0 !important; }
          .cart-offcanvas { width: 85% !important; }
        }
        @media (min-width: 769px) {
          .section-title { font-size: 2.2rem !important; }
          .product-title { font-size: 1rem !important; }
          .price-current { font-size: 1.1rem !important; }
          .cart-offcanvas { width: 400px !important; }
        }
      `}</style>
      
      <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      <Outlet context={{ searchTerm }} /> 
      <Footer />
    </div>
  );
}

// --- ROTA PROTEGIDA ---
function RotaProtegida({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => { setSession(session); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => { setSession(session); });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" /></div>;
  if (!session) return <Navigate to="/login" replace />;
  return children;
}

// --- APP ---
export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Store />} />
            <Route path="/produto/:id" element={<ProductDetails />} />
            <Route path="/minha-conta" element={<MinhaConta />} />
            <Route path="/colecao/:tipo" element={<CollectionPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<RotaProtegida><Admin /></RotaProtegida>} />
          <Route path="/admin/fornecedores" element={<RotaProtegida><Fornecedores /></RotaProtegida>} />
          <Route path="/admin/pedidos" element={<RotaProtegida><AdminPedidos /></RotaProtegida>} />
        </Routes>
        <ShoppingCart />
      </BrowserRouter>
    </CartProvider>
  );
}