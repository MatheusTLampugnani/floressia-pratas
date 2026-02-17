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

  useEffect(() => {
    async function getProduct() {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('id', id)
        .single();

      if (data) setProduct(data);
      setLoading(false);
    }
    getProduct();
  }, [id]);

  if (loading) return <div className="text-center py-5"><Spinner animation="border" /></div>;
  if (!product) return <div className="text-center py-5">Produto não encontrado.</div>;

  const handleBuyNow = () => {
    const text = `Olá! Gostei do *${product.nome}* que vi no site e gostaria de comprar.`;
    window.open(`https://wa.me/5511999999999?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <Container className="py-5">
      <Link to="/" className="btn btn-link text-secondary text-decoration-none mb-4 ps-0">
        <FaArrowLeft className="me-2" /> Voltar para a loja
      </Link>

      <Row className="align-items-center">
        <Col md={6} className="mb-4 mb-md-0">
          <div className="bg-white p-3 shadow-sm">
             <img 
               src={product.imagem_url || "https://placehold.co/500"} 
               alt={product.nome} 
               className="img-fluid w-100"
               style={{ objectFit: 'contain', maxHeight: '500px' }}
             />
          </div>
        </Col>

        <Col md={6}>
          <Badge bg="light" text="dark" className="border mb-2 text-uppercase letter-spacing-1">
            {product.categoria}
          </Badge>
          <h1 className="display-5 mb-3" style={{fontFamily: 'Playfair Display'}}>{product.nome}</h1>
          
          <h3 className="mb-4" style={{color: '#8b8f86', fontWeight: 'bold'}}>
            R$ {product.preco.toFixed(2).replace('.', ',')}
          </h3>

          <p className="text-muted mb-5" style={{lineHeight: '1.8'}}>
            {product.descricao || "Uma peça exclusiva da coleção Floressia Pratas. Acabamento impecável e design sofisticado para realçar sua beleza."}
          </p>

          <div className="d-grid gap-3 d-md-flex">
            <Button 
              variant="dark" 
              size="lg" 
              className="px-5 rounded-0"
              onClick={() => addToCart(product)}
            >
              <FaShoppingCart className="me-2" /> Por na Sacola
            </Button>
            
            <Button 
              variant="outline-success" 
              size="lg" 
              className="px-5 rounded-0"
              onClick={handleBuyNow}
            >
              <FaWhatsapp className="me-2" /> Comprar Agora
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
}