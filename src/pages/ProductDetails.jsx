import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Badge } from 'react-bootstrap';
import { FaWhatsapp, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemPrincipal, setImagemPrincipal] = useState('');

  useEffect(() => {
    async function getProduct() {
      const { data } = await supabase.from('produtos').select('*').eq('id', id).single();
      if (data) {
        setProduct(data);
        setImagemPrincipal(data.imagem_url || "https://placehold.co/500");
      }
      setLoading(false);
    }
    getProduct();
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (!product) return <div className="text-center py-5">Produto não encontrado.</div>;

  const handleBuyNow = () => {
    const refText = product.codigo_final ? ` (Ref: ${product.codigo_final})` : '';
    const text = `Olá! Gostei do *${product.nome}*${refText} - R$ ${product.preco.toFixed(2).replace('.', ',')} que vi no site e gostaria de comprar.`;
    window.open(`https://wa.me/5564992641367?text=${encodeURIComponent(text)}`, '_blank');
  };

  const disponivel = product.em_estoque !== false;
  const isOnPromo = product.preco_antigo && product.preco < product.preco_antigo;
  const formatPrice = (price) => price.toFixed(2).replace('.', ',');

  const galeria = [
    product.imagem_url, 
    product.imagem_url_2, 
    product.imagem_url_3, 
    product.imagem_url_4
  ].filter(url => url != null && url !== "");

  return (
    <Container className="py-5">
      <Link to="/" className="btn btn-link text-secondary text-decoration-none mb-4 ps-0">
        <FaArrowLeft className="me-2" /> Voltar para a loja
      </Link>

      <Row className="align-items-start">
        {/* --- COLUNA DA GALERIA DE FOTOS --- */}
        <Col md={6} className="mb-4 mb-md-0 position-relative">
          {!disponivel && (
            <div className="position-absolute top-50 start-50 translate-middle z-2">
               <Badge bg="secondary" className="px-4 py-2 fs-5 text-uppercase rounded-0 shadow">Esgotado</Badge>
            </div>
          )}
          
          <div className={`bg-white p-3 shadow-sm mb-3 text-center ${!disponivel ? 'opacity-50' : ''}`}>
             <img 
               src={imagemPrincipal} 
               alt={product.nome} 
               className="img-fluid w-100 rounded"
               style={{ objectFit: 'contain', maxHeight: '500px', transition: '0.3s' }}
               onError={(e) => { e.target.src = "https://placehold.co/500?text=Sem+Foto" }}
             />
          </div>

          {galeria.length > 1 && (
            <div className={`d-flex gap-2 justify-content-center flex-wrap ${!disponivel ? 'opacity-50' : ''}`}>
              {galeria.map((imgUrl, index) => (
                <div 
                  key={index} 
                  className={`bg-light rounded overflow-hidden p-1 ${imagemPrincipal === imgUrl ? 'border border-dark border-2' : 'border border-light shadow-sm'}`}
                  style={{ width: '80px', height: '80px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onClick={() => setImagemPrincipal(imgUrl)}
                >
                  <img 
                    src={imgUrl} 
                    alt={`Foto ${index + 1}`} 
                    className="w-100 h-100" 
                    style={{ objectFit: 'cover' }} 
                    onError={(e) => { e.target.src = "https://placehold.co/80?text=Erro" }}
                  />
                </div>
              ))}
            </div>
          )}
        </Col>

        <Col md={6} className="ps-md-5">
          <div className="d-flex gap-2 mb-3">
            <Badge bg="light" text="dark" className="border text-uppercase letter-spacing-1">
              {product.categoria}
            </Badge>
            {isOnPromo && (
              <Badge bg="danger" className="text-uppercase letter-spacing-1">
                Promoção
              </Badge>
            )}
          </div>
          
          {/* TÍTULO */}
          <h1 className="display-5 mb-1" style={{fontFamily: 'Playfair Display', fontWeight: '600'}}>{product.nome}</h1>
          
          {/* CÓDIGO DE REFERÊNCIA (SKU) */}
          {product.codigo_final ? (
            <div className="text-muted mb-4" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
              Referência: <span className="fw-semibold font-monospace">{product.codigo_final}</span>
            </div>
          ) : (
            <div className="mb-4"></div>
          )}
          
          {/* PREÇOS */}
          <div className="mb-4">
            {isOnPromo ? (
              <div>
                <span className="text-muted text-decoration-line-through fs-5 me-2">
                  R$ {formatPrice(product.preco_antigo)}
                </span>
                <h3 className="d-inline price-tag fw-bold" style={{ color: '#ff6b00' }}>
                  R$ {formatPrice(product.preco)}
                </h3>
              </div>
            ) : (
              <h3 className="price-tag fw-bold text-dark">
                R$ {formatPrice(product.preco)}
              </h3>
            )}
          </div>

          <p className="text-muted mb-5" style={{lineHeight: '1.8', fontSize: '1.05rem'}}>
            {product.descricao || "Uma peça exclusiva da coleção Floressia Pratas. Acabamento impecável e design sofisticado para realçar sua beleza."}
          </p>

          <div className="d-grid gap-3 d-md-flex">
            <Button 
              variant={disponivel ? "dark" : "secondary"} 
              size="lg" 
              className="px-5 rounded-0 text-uppercase letter-spacing-1"
              style={{ fontSize: '0.9rem' }}
              onClick={() => disponivel && addToCart(product)}
              disabled={!disponivel}
            >
              <FaShoppingCart className="me-2" /> 
              {disponivel ? 'Por na Sacola' : 'Esgotado'}
            </Button>
            
            {disponivel && (
              <Button 
                variant="outline-success" 
                size="lg" 
                className="px-4 rounded-0 text-uppercase letter-spacing-1"
                style={{ fontSize: '0.9rem' }}
                onClick={handleBuyNow}
              >
                <FaWhatsapp className="me-2" /> Comprar Agora
              </Button>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
}