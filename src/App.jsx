import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import { Container, Navbar, Nav, Row, Col, Card, Button, Offcanvas, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaWhatsapp, FaTrash, FaInstagram, FaTiktok, FaTruck, FaCreditCard, FaGift, FaGem, FaBarcode, FaLock, FaRegEnvelope } from 'react-icons/fa';
import { supabase } from './supabase';
import { CartProvider, useCart } from './context/CartContext';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';
import Login from './pages/Login';

function ProductCard({ product }) {
  const { addToCart } = useCart();
  
  return (
    <Col md={4} lg={3} className="mb-4">
      <Card className="h-100 shadow-sm border-0">
        <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div style={{ height: '250px', overflow: 'hidden', cursor: 'pointer' }}>
            <Card.Img 
              variant="top" 
              src={product.imagem_url || "https://placehold.co/300"} 
              style={{ objectFit: 'cover', height: '100%', width: '100%', transition: 'transform 0.3s' }} 
            />
          </div>
        </Link>

        <Card.Body className="d-flex flex-column text-center">
          <Link to={`/produto/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
             <Card.Title style={{fontFamily: 'Playfair Display', cursor: 'pointer'}}>
               {product.nome}
             </Card.Title>
          </Link>

          <Card.Text className="text-muted small">{product.descricao}</Card.Text>
          
          <h5 className="my-3 price-tag">
             R$ {product.preco.toFixed(2).replace('.', ',')}
          </h5>
          
          <Button variant="dark" onClick={() => addToCart(product)} className="mt-auto w-100 rounded-0">
            Adicionar à Sacola
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
}

function ShoppingCart() {
  const { showCart, setShowCart, cartItems, addToCart, decreaseQuantity, removeFromCart, cartTotal } = useCart();
  const PHONE_NUMBER = "5511999999999"; 

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
    <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end" style={{ width: '400px' }}>
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
                    <img 
                      src={item.imagem_url || "https://placehold.co/100"} 
                      alt={item.nome} 
                      className="w-100 h-100 object-fit-cover" 
                    />
                  </div>

                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <h6 className="mb-1 fw-bold text-truncate" style={{ maxWidth: '180px' }}>{item.nome}</h6>
                      <button 
                        onClick={() => removeFromCart(item.id)} 
                        className="btn btn-link text-danger p-0 text-decoration-none"
                        title="Remover item"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                    
                    <p className="mb-2 text-muted small" style={{ fontSize: '0.85rem' }}>
                      Unitário: R$ {item.preco.toFixed(2).replace('.', ',')}
                    </p>

                    <div className="d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center border rounded">
                        <button 
                          onClick={() => decreaseQuantity(item.id)}
                          className="btn btn-sm px-2 py-0 border-end"
                          style={{ height: '28px' }}
                        >
                          -
                        </button>
                        <span className="px-3 small fw-bold">{item.quantity}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="btn btn-sm px-2 py-0 border-start"
                          style={{ height: '28px' }}
                        >
                          +
                        </button>
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
              <small className="d-block text-muted mb-3 text-center">
                Frete e descontos calculados no WhatsApp
              </small>
              <Button 
                variant="success" 
                size="lg" 
                className="w-100 rounded-0 d-flex align-items-center justify-content-center gap-2 text-white fw-bold py-3" 
                onClick={checkoutWhatsApp}
                style={{ background: '#25D366', borderColor: '#25D366' }}
              >
                <FaWhatsapp size={24} /> FINALIZAR PEDIDO
              </Button>
            </div>
          </>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

function Header() {
  const { setShowCart, cartItems } = useCart();

  return (
    <Navbar bg="white" expand="lg" className="shadow-sm sticky-top py-2">
      <Container>
        <Navbar.Brand as={Link} to="/" className="mx-auto mx-lg-0">
          <img 
            src="src/assets/banner-floressia.png" 
            alt="Floressia Pratas" 
            style={{ maxHeight: '60px', width: 'auto' }} 
          />
        </Navbar.Brand>
        
        <Nav className="ms-auto position-absolute end-0 pe-3 top-50 translate-middle-y position-lg-static translate-middle-lg-0">
          <Button 
            variant="outline-dark" 
            onClick={() => setShowCart(true)} 
            className="position-relative border-0 p-2 d-flex align-items-center justify-content-center"
          >
            <FaShoppingCart size={22} />
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

function Store() {
  const [products, setProducts] = useState([]);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    const { data } = await supabase.from('produtos').select('*');
    if (data) setProducts(data);
  }

  const destaques = products.filter(p => p.destaque === true);
  const novidades = products.filter(p => p.novidade === true);
  const produtosCatalogo = filtro === 'todos' 
    ? products 
    : products.filter(p => p.categoria === filtro);

  return (
    <>
      <div className="bg-light py-2 mb-4 border-bottom">
        <Container className="d-flex justify-content-center gap-2 flex-wrap">
           {['todos', 'aneis', 'colares', 'brincos', 'pulseiras'].map(cat => (
             <Button 
               key={cat}
               variant={filtro === cat ? 'dark' : 'outline-dark'} 
               onClick={() => setFiltro(cat)} 
               size="sm" 
               className="rounded-0 px-3 text-uppercase"
               style={{fontSize: '0.8rem', letterSpacing: '1px'}}
             >
               {cat}
             </Button>
           ))}
        </Container>
      </div>

      <div className="bg-white py-4 border-bottom mb-5">
        <Container>
          <Row className="gy-4 justify-content-center">
            
            <Col xs={12} md={6} lg={3} className="d-flex align-items-center justify-content-center gap-3">
              <FaTruck size={24} style={{ color: '#8b8f86' }} />
              <div className="text-start">
                <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Envios Ágeis</h6>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Postagem em até 24h</small>
              </div>
            </Col>

            <Col xs={12} md={6} lg={3} className="d-flex align-items-center justify-content-center gap-3">
              <FaCreditCard size={24} style={{ color: '#8b8f86' }} />
              <div className="text-start">
                <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Até 6x Sem Juros</h6>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Mínimo R$ 50,00</small>
              </div>
            </Col>

            <Col xs={12} md={6} lg={3} className="d-flex align-items-center justify-content-center gap-3">
              <FaGift size={24} style={{ color: '#8b8f86' }} />
              <div className="text-start">
                <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>Frete Grátis</h6>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Acima de R$ 300</small>
              </div>
            </Col>

            <Col xs={12} md={6} lg={3} className="d-flex align-items-center justify-content-center gap-3">
              <FaGem size={24} style={{ color: '#8b8f86' }} />
              <div className="text-start">
                <h6 className="mb-0 fw-bold text-uppercase" style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}>5% OFF no Pix</h6>
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Pagamento à vista</small>
              </div>
            </Col>

          </Row>
        </Container>
      </div>

      <Container className="py-4">
        {filtro === 'todos' && destaques.length > 0 && (
          <div className="mb-5">
            <h3 className="text-center mb-4 display-6" style={{fontFamily: 'Playfair Display'}}>
              Destaques da Semana
            </h3>
            <div className="divider-custom mb-4"></div>
            <Row>
              {destaques.map(product => <ProductCard key={product.id} product={product} />)}
            </Row>
          </div>
        )}

        {filtro === 'todos' && novidades.length > 0 && (
          <div className="mb-5">
            <div className="text-center mb-4">
              <span className="badge bg-dark text-uppercase letter-spacing-2 p-2 mb-2">New In</span>
              <h3 className="display-6" style={{fontFamily: 'Playfair Display'}}>Acabou de Chegar</h3>
            </div>
            <Row>
              {novidades.map(product => <ProductCard key={product.id} product={product} />)}
            </Row>
            <hr className="my-5" />
          </div>
        )}

        <div className="text-center mb-5">
          <h2 className="display-6" style={{fontFamily: 'Playfair Display'}}>
            {filtro === 'todos' ? 'Catálogo Completo' : filtro.charAt(0).toUpperCase() + filtro.slice(1)}
          </h2>
          <div className="divider-custom"></div>
          {filtro === 'todos' && <p className="text-muted">Explore todas as nossas peças</p>}
        </div>
        
        <Row>
          {produtosCatalogo.map(product => <ProductCard key={product.id} product={product} />)}
          {produtosCatalogo.length === 0 && (
            <div className="text-center py-5 w-100 text-muted">
              Nenhuma peça encontrada nesta categoria.
            </div>
          )}
        </Row>
      </Container>
    </>
  );
}

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-top pt-5 pb-3 mt-auto">
      <Container>
        <Row className="gy-5">
          <Col lg={3} md={6} className="text-center text-md-start">
            <h6 className="fw-bold mb-3" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>SIGA-NOS</h6>
            
            <div className="d-flex gap-2 justify-content-center justify-content-md-start">
              <a 
                href="https://instagram.com/floressiapratas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" 
                style={{ width: '35px', height: '35px', transition: 'all 0.3s' }}
                title="Siga-nos no Instagram"
              >
                <FaInstagram size={18} color="white" />
              </a>
              <a 
                href="https://tiktok.com/@floressiapratas" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-dark btn-sm rounded-circle d-flex align-items-center justify-content-center p-0" 
                style={{ width: '35px', height: '35px', transition: 'all 0.3s' }}
                title="Siga-nos no TikTok"
              >
                <FaTiktok size={16} color="white" />
              </a>
            </div>
          </Col>

          <Col lg={3} md={6} sm={6}>
            <h6 className="fw-bold mb-3 text-center text-sm-start" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>INSTITUCIONAL</h6>
            <ul className="list-unstyled text-muted small text-center text-sm-start" style={{ lineHeight: '2.2' }}>
              <li><a href="#" className="text-decoration-none text-secondary hover-link">Quem Somos</a></li>
              <li><a href="#" className="text-decoration-none text-secondary hover-link">Política de Privacidade</a></li>
              <li><a href="#" className="text-decoration-none text-secondary hover-link">Termos e Condições</a></li>
              <li><a href="#" className="text-decoration-none text-secondary hover-link">Trocas e Devoluções</a></li>
            </ul>
          </Col>

          <Col lg={3} md={6} sm={6}>
            <h6 className="fw-bold mb-3 text-center text-sm-start" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>ATENDIMENTO</h6>
            <ul className="list-unstyled text-muted small text-center text-sm-start" style={{ lineHeight: '1.8' }}>
              <li className="mb-2"><FaWhatsapp className="me-2 text-success" size={16} /> (11) 99999-9999</li>
              <li className="mb-2"><FaRegEnvelope className="me-2" size={16} />floressiapratas@gmail.com</li>
            </ul>
          </Col>

          <Col lg={3} md={6}>
             <h6 className="fw-bold mb-3 text-center text-md-start" style={{ fontSize: '0.9rem', letterSpacing: '1px' }}>PAGAMENTO & SEGURANÇA</h6>
             <div className="d-flex gap-2 mb-4 flex-wrap justify-content-center justify-content-md-start">
                 <div className="border p-1 rounded bg-light" title="Cartão"><FaCreditCard size={20} className="text-secondary"/></div>
                 <div className="border p-1 rounded bg-light" title="Boleto"><FaBarcode size={20} className="text-secondary"/></div>
                 <div className="border p-1 rounded bg-light" title="Pix"><FaGem size={20} className="text-secondary"/></div>
             </div>
              <div className="d-flex gap-2 justify-content-center justify-content-md-start">
                 <div className="border px-2 py-1 rounded bg-light small"><FaLock className="text-success me-1"/> Site Seguro</div>
             </div>
          </Col>
        </Row>

        <hr className="my-4" />

        <Row className="align-items-center gy-3">
          <Col md={6} className="text-center text-md-start">
            <small className="text-muted">
              © {currentYear} <strong>Floressia Pratas</strong>. Todos os direitos reservados.
            </small>
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

function StoreLayout() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Header />
      
      <Outlet /> 
      
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        
        <Routes>
          <Route element={<StoreLayout />}>
            <Route path="/" element={<Store />} />
            <Route path="/produto/:id" element={<ProductDetails />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <ShoppingCart />
        
      </BrowserRouter>
    </CartProvider>
  );
}