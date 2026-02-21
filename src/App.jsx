import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet, useParams, Navigate } from 'react-router-dom';
import { Container, Navbar, Nav, Row, Col, Card, Button, Offcanvas, Badge, Spinner } from 'react-bootstrap';
import { FaShoppingCart, FaWhatsapp, FaTrash, FaInstagram, FaTiktok, FaTruck, FaCreditCard, FaGift, FaGem, FaBarcode, FaLock, FaRegEnvelope, FaArrowLeft } from 'react-icons/fa';
import { supabase } from './supabase';
import { CartProvider, useCart } from './context/CartContext';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';
import Fornecedores from './pages/Fornecedores';

// --- CARD DO PRODUTO ---
function ProductCard({ product }) {
  const { addToCart } = useCart();
  const disponivel = product.em_estoque !== false;
  const isOnPromo = product.preco_antigo && product.preco < product.preco_antigo;
  const formatPrice = (price) => price.toFixed(2).replace('.', ',');
  
  return (
    <Col xs={6} md={4} lg={3} className="mb-4 px-2 px-md-3">
      <Card className="h-100 shadow-sm border-0 position-relative product-card rounded-0">
        {isOnPromo && disponivel && (
          <Badge bg="danger" className="position-absolute top-0 start-0 m-2 rounded-0 z-1" style={{ letterSpacing: '1px', fontSize: '0.6rem' }}>
            PROMO
          </Badge>
        )}

        <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="product-image-container" style={{ overflow: 'hidden', cursor: 'pointer', opacity: disponivel ? 1 : 0.6, backgroundColor: '#f8f9fa' }}>
            <Card.Img 
              variant="top" 
              src={product.imagem_url || "https://placehold.co/300"} 
              className="product-img rounded-0"
              style={{ objectFit: 'cover', width: '100%', aspectRatio: '1/1', transition: 'transform 0.4s ease' }} 
            />
          </div>
        </Link>

        <Card.Body className="d-flex flex-column text-center p-2 p-md-3">
          <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
             <Card.Title style={{fontFamily: 'Playfair Display', cursor: 'pointer'}} className="text-truncate fs-6 mb-1">
               {product.nome}
             </Card.Title>
          </Link>

          <Card.Text className="text-muted small text-truncate d-none d-md-block mb-2">{product.descricao}</Card.Text>
          
          <div className="mt-auto mb-3">
            {isOnPromo ? (
              <div className="d-flex flex-column flex-lg-row align-items-center justify-content-center gap-1">
                 <span className="text-muted text-decoration-line-through" style={{fontSize: '0.75rem'}}>
                   R$ {formatPrice(product.preco_antigo)}
                 </span>
                 <span className="price-tag fw-bold text-success" style={{fontSize: '1rem'}}>
                   R$ {formatPrice(product.preco)}
                 </span>
              </div>
            ) : (
              <span className="price-tag fw-bold" style={{fontSize: '1rem'}}>
                 R$ {formatPrice(product.preco)}
              </span>
            )}
          </div>
          
          <Button 
            variant={disponivel ? "dark" : "secondary"} 
            onClick={() => disponivel && addToCart(product)} 
            className="w-100 rounded-0 text-uppercase fw-bold"
            style={{ fontSize: '0.7rem', padding: '10px 0', letterSpacing: '0.5px' }}
            disabled={!disponivel}
          >
            {disponivel ? 'Adicionar' : 'Esgotado'}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
}

// --- SACOLA DE COMPRAS ---
function ShoppingCart() {
  const { showCart, setShowCart, cartItems, addToCart, decreaseQuantity, removeFromCart, cartTotal } = useCart();
  const PHONE_NUMBER = "5564992641367"; 

  const checkoutWhatsApp = () => {
    if (cartItems.length === 0) return;
    let message = "*Olá! Gostaria de finalizar meu pedido na Floressia:*\n\n";
    cartItems.forEach(item => {
      message += `• ${item.quantity}x ${item.nome}\n   (R$ ${(item.preco * item.quantity).toFixed(2)})\n`;
    });
    message += `\n*Valor Total: R$ ${cartTotal.toFixed(2)}*`;
    message += "\n\nAguardo instruções para pagamento e entrega.";
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end" style={{ width: '100%', maxWidth: '400px' }}>
      <Offcanvas.Header closeButton className="border-bottom">
        <Offcanvas.Title style={{ fontFamily: 'Playfair Display', fontSize: '1.5rem' }}>
          Sua Sacola ({cartItems.length})
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body className="d-flex flex-column p-0">
        {cartItems.length === 0 ? (
          <div className="text-center my-auto p-4">
            <FaShoppingCart size={50} className="text-muted mb-3 opacity-25" />
            <h5 className="text-muted">Sua sacola está vazia</h5>
            <p className="small text-secondary mb-4">Que tal explorar nossas novidades?</p>
            <Button variant="dark" onClick={() => setShowCart(false)}>Começar a Comprar</Button>
          </div>
        ) : (
          <>
            <div className="flex-grow-1 overflow-auto p-3">
              {cartItems.map(item => (
                <div key={item.id} className="d-flex align-items-center mb-4 pb-4 border-bottom position-relative">
                  <div className="flex-shrink-0 bg-light rounded overflow-hidden" style={{ width: '80px', height: '80px' }}>
                    <img src={item.imagem_url || "https://placehold.co/100"} alt={item.nome} className="w-100 h-100 object-fit-cover" />
                  </div>
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="mb-1 fw-bold text-truncate" style={{ maxWidth: '160px' }}>{item.nome}</h6>
                      <button onClick={() => removeFromCart(item.id)} className="btn btn-link text-danger p-0 text-decoration-none">
                        <FaTrash size={14} />
                      </button>
                    </div>
                    <p className="mb-2 text-muted small" style={{ fontSize: '0.85rem' }}>
                      Unitário: R$ {item.preco.toFixed(2).replace('.', ',')}
                    </p>
                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center border rounded">
                        <button onClick={() => decreaseQuantity(item.id)} className="btn btn-sm px-2 py-0 border-end" style={{ height: '28px' }}>-</button>
                        <span className="px-3 small fw-bold">{item.quantity}</span>
                        <button onClick={() => addToCart(item)} className="btn btn-sm px-2 py-0 border-start" style={{ height: '28px' }}>+</button>
                      </div>
                      <span className="fw-bold text-dark">
                        R$ {(item.preco * item.quantity).toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-light p-4 border-top mt-auto">
              <div className="d-flex justify-content-between align-items-end mb-3">
                <span className="text-muted">Subtotal</span>
                <h3 className="mb-0 fw-bold" style={{ fontFamily: 'Playfair Display' }}>
                  R$ {cartTotal.toFixed(2).replace('.', ',')}
                </h3>
              </div>
              <small className="d-block text-muted mb-3 text-center">Frete e descontos calculados no WhatsApp</small>
              <Button variant="success" size="lg" className="w-100 rounded-0 d-flex align-items-center justify-content-center gap-2 text-white fw-bold py-3" onClick={checkoutWhatsApp} style={{ background: '#25D366', borderColor: '#25D366' }}>
                <FaWhatsapp size={24} /> FINALIZAR PEDIDO
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

// --- CABEÇALHO ---
function Header() {
  const { setShowCart, cartItems } = useCart();
  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-2">
      <Container className="position-relative">
        <Navbar.Brand as={Link} to="/" className="mx-auto mx-lg-0">
          <img 
            src="src/assets/banner-floressia.png" 
            alt="Floressia Pratas" 
            style={{ maxHeight: '50px', width: 'auto' }} 
            className="logo-img"
          />
        </Navbar.Brand>
        <Nav className="position-absolute end-0 pe-3 top-50 translate-middle-y">
          <Button variant="outline-dark" onClick={() => setShowCart(true)} className="position-relative border-0 p-2 d-flex align-items-center justify-content-center bg-light rounded-circle" style={{ width: '40px', height: '40px' }}>
            <FaShoppingCart size={18} />
            {cartItems.length > 0 && (
              <Badge bg="dark" className="position-absolute top-0 start-100 translate-middle rounded-circle" style={{ fontSize: '0.65rem' }}>
                {cartItems.length}
              </Badge>
            )}
          </Button>
        </Nav>
      </Container>
    </Navbar>
  );
}

// --- PÁGINA INICIAL (VITRINE) ---
function Store() {
  const [products, setProducts] = useState([]);
  const [filtro, setFiltro] = useState('todos');

  const [mostrarTodosDestaques, setMostrarTodosDestaques] = useState(false);
  const [mostrarTodasNovidades, setMostrarTodasNovidades] = useState(false);
  const [mostrarTodoCatalogo, setMostrarTodoCatalogo] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('produtos').select('*').order('id', { ascending: false });
    if (data) setProducts(data);
  }

  const destaques = products.filter(p => p.destaque === true || (p.preco_antigo && p.preco < p.preco_antigo));
  const novidades = products.filter(p => p.novidade === true);
  const produtosCatalogo = filtro === 'todos' ? products : products.filter(p => p.categoria === filtro);

  const destaquesExibidos = destaques.slice(0, 4);
  const novidadesExibidas = novidades.slice(0, 4);
  const catalogoExibido = produtosCatalogo.slice(0, 8);

  const handleFiltroClick = (categoria) => {
    setFiltro(categoria);
    setMostrarTodoCatalogo(false);
  };

  return (
    <>
      {/* MENU DE CATEGORIAS */}
      <div className="bg-light py-2 mb-0 border-bottom">
        <Container>
          <div className="category-scroll d-flex justify-content-md-center gap-2 pb-2 pb-md-0">
             {['todos', 'aneis', 'colares', 'brincos', 'pulseiras'].map(cat => (
               <Button 
                 key={cat}
                 variant={filtro === cat ? 'dark' : 'outline-dark'} 
                 onClick={() => handleFiltroClick(cat)} 
                 size="sm" 
                 className="rounded-pill px-4 text-uppercase flex-shrink-0"
                 style={{fontSize: '0.75rem', letterSpacing: '1px'}}
               >
                 {cat}
               </Button>
             ))}
          </div>
        </Container>
      </div>

{/* BARRA DE BENEFÍCIOS (Estilo Premium) */}
      <div className="bg-light py-4 mb-5">
        <Container>
          <Row className="gy-4 justify-content-center">
            
            <Col xs={6} lg={3} className="d-flex justify-content-center">
              <div className="d-flex align-items-center gap-3 text-start">
                <FaTruck size={26} className="text-dark" />
                <div>
                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Envios Ágeis</h6>
                  <small className="text-muted d-none d-md-block" style={{ fontSize: '0.7rem' }}>Postagem em até 24h</small>
                </div>
              </div>
            </Col>

            <Col xs={6} lg={3} className="d-flex justify-content-center">
              <div className="d-flex align-items-center gap-3 text-start">
                <FaCreditCard size={26} className="text-dark" />
                <div>
                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>6x Sem Juros</h6>
                  <small className="text-muted d-none d-md-block" style={{ fontSize: '0.7rem' }}>Parc. Min R$ 50</small>
                </div>
              </div>
            </Col>

            <Col xs={6} lg={3} className="d-flex justify-content-center">
              <div className="d-flex align-items-center gap-3 text-start">
                <FaGift size={26} className="text-dark" />
                <div>
                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>Frete Grátis</h6>
                  <small className="text-muted d-none d-md-block" style={{ fontSize: '0.7rem' }}>Acima de R$ 300</small>
                </div>
              </div>
            </Col>

            <Col xs={6} lg={3} className="d-flex justify-content-center">
              <div className="d-flex align-items-center gap-3 text-start">
                <FaGem size={26} className="text-dark" />
                <div>
                  <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>5% OFF no Pix</h6>
                  <small className="text-muted d-none d-md-block" style={{ fontSize: '0.7rem' }}>Pagamento à vista</small>
                </div>
              </div>
            </Col>

          </Row>
        </Container>
      </div>

      <Container className="py-2 py-md-4 px-3 px-md-auto">
        
        {/* DESTAQUES */}
        {filtro === 'todos' && destaques.length > 0 && (
          <div className="mb-5 pb-2">
            <h3 className="text-center mb-4 fs-2" style={{fontFamily: 'Playfair Display'}}>Destaques</h3>
            <div className="divider-custom mb-4"></div>
            <Row className="g-2 g-md-4">
              {destaquesExibidos.map(product => <ProductCard key={product.id} product={product} />)}
            </Row>
            {destaques.length > 4 && (
              <div className="text-center mt-3">
                <Button as={Link} to="/colecao/destaques" variant="outline-dark" className="px-4 py-2 rounded-0 text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>
                  Ver Todos os Destaques
                </Button>
              </div>
            )}
          </div>
        )}

        {/* NOVIDADES */}
        {filtro === 'todos' && novidades.length > 0 && (
          <div className="mb-5 pb-2">
            <div className="text-center mb-4">
              <span className="badge bg-dark text-uppercase letter-spacing-2 p-2 mb-2 rounded-0">New In</span>
              <h3 className="fs-2" style={{fontFamily: 'Playfair Display'}}>Lançamentos</h3>
            </div>
            <Row className="g-2 g-md-4">
              {novidadesExibidas.map(product => <ProductCard key={product.id} product={product} />)}
            </Row>
            {novidades.length > 4 && (
              <div className="text-center mt-3">
                <Button as={Link} to="/colecao/novidades" variant="outline-dark" className="px-4 py-2 rounded-0 text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>
                  Ver Todas as Novidades
                </Button>
              </div>
            )}
            <hr className="my-5 opacity-25" />
          </div>
        )}

        {/* CATÁLOGO */}
        <div className="text-center mb-4">
          <h2 className="fs-2" style={{fontFamily: 'Playfair Display'}}>
            {filtro === 'todos' ? 'Coleção Completa' : filtro.charAt(0).toUpperCase() + filtro.slice(1)}
          </h2>
          <div className="divider-custom"></div>
        </div>
        
        <Row className="g-2 g-md-4">
          {catalogoExibido.map(product => <ProductCard key={product.id} product={product} />)}
          {produtosCatalogo.length === 0 && (
            <div className="text-center py-5 w-100 text-muted">Nenhuma peça encontrada nesta categoria.</div>
          )}
        </Row>

        {produtosCatalogo.length > 8 && (
          <div className="text-center mt-4 mb-5">
            <Button as={Link} to={`/colecao/${filtro}`} variant="dark" className="px-5 py-2 rounded-0 text-uppercase" style={{fontSize: '0.8rem', letterSpacing: '1px'}}>
              Ver Mais Peças ({produtosCatalogo.length})
            </Button>
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

  let filtered = [];
  let title = "";

  if (tipo === 'destaques') {
    filtered = products.filter(p => p.destaque === true || (p.preco_antigo && p.preco < p.preco_antigo));
    title = "Destaques e Promoções";
  } else if (tipo === 'novidades') {
    filtered = products.filter(p => p.novidade === true);
    title = "Lançamentos";
  } else if (tipo === 'todos') {
    filtered = products;
    title = "Coleção Completa";
  } else {
    filtered = products.filter(p => p.categoria === tipo);
    title = `${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`;
  }

  return (
    <Container className="py-4 py-md-5 px-3 px-md-auto">
      <Link to="/" className="btn btn-link text-secondary text-decoration-none mb-3 ps-0 d-inline-flex align-items-center" style={{fontSize: '0.9rem'}}>
        <FaArrowLeft className="me-2" /> Voltar para a loja
      </Link>
      
      <div className="text-center mb-4 mb-md-5">
        <h2 className="fs-1" style={{fontFamily: 'Playfair Display'}}>{title}</h2>
        <div className="divider-custom"></div>
        <p className="text-muted small">{filtered.length} peças encontradas</p>
      </div>
      
      <Row className="g-2 g-md-4">
        {filtered.map(product => <ProductCard key={product.id} product={product} />)}
        {filtered.length === 0 && (
          <div className="text-center py-5 w-100 text-muted">Nenhuma peça encontrada.</div>
        )}
      </Row>
    </Container>
  );
}

// --- RODAPÉ ---
function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-white border-top pt-5 pb-3 mt-auto">
      <Container>
        <Row className="gy-4 gy-md-5 text-center text-md-start">
          <Col lg={3} md={6}>
            <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>SIGA-NOS</h6>
            <div className="d-flex gap-2 justify-content-center justify-content-md-start">
              <a href="https://instagram.com/floressiapratas" target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '35px', height: '35px' }}>
                <FaInstagram size={18} color="white" />
              </a>
              <a href="https://tiktok.com/@floressiapratas" target="_blank" rel="noopener noreferrer" className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" style={{ width: '35px', height: '35px' }}>
                <FaTiktok size={16} color="white" />
              </a>
            </div>
          </Col>
          <Col lg={3} md={6} sm={6}>
            <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>INSTITUCIONAL</h6>
            <ul className="list-unstyled text-muted small" style={{ lineHeight: '2.2' }}>
              <li><a href="#" className="text-decoration-none text-secondary">Quem Somos</a></li>
              <li><a href="#" className="text-decoration-none text-secondary">Trocas e Devoluções</a></li>
            </ul>
          </Col>
          <Col lg={3} md={6} sm={6}>
            <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>ATENDIMENTO</h6>
            <ul className="list-unstyled text-muted small" style={{ lineHeight: '1.8' }}>
              <li className="mb-2"><FaWhatsapp className="me-2 text-success" /> (64) 99264-1367</li>
              <li className="mb-2"><FaRegEnvelope className="me-2" /> floressiapratas@gmail.com</li>
            </ul>
          </Col>
          <Col lg={3} md={6}>
             <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>SEGURANÇA</h6>
             <div className="d-flex gap-2 mb-3 justify-content-center justify-content-md-start">
                 <FaCreditCard size={24} className="text-secondary"/>
                 <FaBarcode size={24} className="text-secondary"/>
                 <FaGem size={24} className="text-secondary"/>
             </div>
              <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                 <div className="border px-2 py-1 rounded bg-light small d-inline-flex align-items-center"><FaLock className="text-success me-1"/> Site Seguro</div>
             </div>
          </Col>
        </Row>
        <hr className="my-4" />
        <Row className="align-items-center gy-3">
          <Col md={6} className="text-center text-md-start">
            <small className="text-muted">© {currentYear} <strong>Floressia Pratas</strong>. Todos os direitos reservados.</small>
          </Col>
          <Col md={6} className="text-center text-md-end">
            <Link to="/login" className="text-muted text-decoration-none" style={{ fontSize: '0.75rem' }}>
              <FaLock className="me-1 mb-1" size={10} /> Área Restrita
            </Link>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

// --- ESTRUTURA E ESTILOS CSS GLOBAIS ---
function StoreLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <style>{`
        /* Hover nos cards para subir levemente */
        .product-card:hover .product-img { transform: scale(1.05); }
        
        /* Menu de categorias rolável no celular */
        .category-scroll { 
          overflow-x: auto; 
          white-space: nowrap; 
          -webkit-overflow-scrolling: touch; 
          scrollbar-width: none; 
        }
        .category-scroll::-webkit-scrollbar { display: none; }
        
        /* Tamanho do logo no celular vs PC */
        @media (max-width: 768px) {
          .logo-img { max-height: 40px !important; }
        }
      `}</style>
      
      <Header />
      <Outlet /> 
      <Footer />
    </div>
  );
}

// --- ROTA PROTEGIDA DO ADMIN ---
function RotaProtegida({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
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
            <Route path="/colecao/:tipo" element={<CollectionPage />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={
            <RotaProtegida>
              <Admin />
            </RotaProtegida>
          } />
          <Route path="/admin/fornecedores" element={
            <RotaProtegida>
              <Fornecedores />
            </RotaProtegida>
          } />
        </Routes>
        <ShoppingCart />
      </BrowserRouter>
    </CartProvider>
  );
}