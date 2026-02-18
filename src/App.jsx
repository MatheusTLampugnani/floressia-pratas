import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Container, Navbar, Nav, Row, Col, Card, Button, Offcanvas, Badge } from 'react-bootstrap';
import { FaShoppingCart, FaWhatsapp, FaTrash, FaInstagram, FaPhone, FaEnvelope, FaTruck, FaCreditCard, FaGift, FaGem, FaTiktok, FaBarcode, FaLock, FaRegEnvelope, FaQrcode } from 'react-icons/fa';
import { supabase } from './supabase';
import { CartProvider, useCart } from './context/CartContext';
import Admin from './pages/Admin';
import ProductDetails from './pages/ProductDetails';

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
  const { showCart, setShowCart, cartItems, removeFromCart, cartTotal } = useCart();
  const PHONE_NUMBER = "5511999999999"; 

  const checkoutWhatsApp = () => {
    if (cartItems.length === 0) return;
    let message = "*Olá! Gostaria de fazer o seguinte pedido:*\n\n";
    cartItems.forEach(item => {
      message += `• ${item.quantity}x ${item.nome} - R$ ${(item.preco * item.quantity).toFixed(2)}\n`;
    });
    message += `\n*Total: R$ ${cartTotal.toFixed(2)}*`;
    message += "\n\nComo podemos prosseguir?";
    const url = `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Offcanvas show={showCart} onHide={() => setShowCart(false)} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title style={{fontFamily: 'Playfair Display'}}>Sua Sacola</Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        {cartItems.length === 0 ? (
          <p className="text-center text-muted mt-5">Sua sacola está vazia.</p>
        ) : (
          <>
            {cartItems.map(item => (
              <div key={item.id} className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <div>
                  <strong>{item.nome}</strong>
                  <div className="text-muted small">{item.quantity}x R$ {item.preco.toFixed(2)}</div>
                </div>
                <Button variant="outline-danger" size="sm" onClick={() => removeFromCart(item.id)}>
                  <FaTrash />
                </Button>
              </div>
            ))}
            <div className="mt-4 pt-3 border-top">
              <h4>Total: R$ {cartTotal.toFixed(2).replace('.', ',')}</h4>
              <Button variant="success" className="w-100 mt-3 py-2" onClick={checkoutWhatsApp}>
                <FaWhatsapp className="me-2" /> Finalizar Pedido
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
            className="position-relative border-0"
          >
            <FaShoppingCart size={22} />
            {cartItems.length > 0 && (
              <Badge bg="dark" className="position-absolute top-0 start-100 translate-middle rounded-circle">
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
              <li className="mt-3">Seg. a Sex. das 9h às 18h</li>
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
          <Col md={12} className="text-center">
            <small className="text-muted">
              © {currentYear} <strong>Floressia Pratas</strong>. Todos os direitos reservados.
            </small>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="d-flex flex-column min-vh-100"> 
          <Header />
          
          <Routes>
            <Route path="/" element={<Store />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/produto/:id" element={<ProductDetails />} />
          </Routes>

          <Footer />
        </div>
        <ShoppingCart />
      </BrowserRouter>
    </CartProvider>
  );
}