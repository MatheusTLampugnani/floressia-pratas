import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Badge, Form, Alert } from 'react-bootstrap';
import { FaWhatsapp, FaShoppingCart, FaArrowLeft, FaStar } from 'react-icons/fa';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemPrincipal, setImagemPrincipal] = useState('');
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [nomeAvaliacao, setNomeAvaliacao] = useState('');
  const [textoAvaliacao, setTextoAvaliacao] = useState('');
  const [notaAvaliacao, setNotaAvaliacao] = useState(5);
  const [hoverStar, setHoverStar] = useState(0);
  const [loadingAvaliacao, setLoadingAvaliacao] = useState(false);
  const [mensagemAvaliacao, setMensagemAvaliacao] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const { data: prodData } = await supabase.from('produtos').select('*').eq('id', id).single();
      if (prodData) {
        setProduct(prodData);
        setImagemPrincipal(prodData.imagem_url || "https://placehold.co/500");
      }
      
      await fetchAvaliacoes();
      setLoading(false);
    }
    
    fetchData();
    window.scrollTo(0, 0); 
  }, [id]);

  async function fetchAvaliacoes() {
    const { data } = await supabase.from('avaliacoes').select('*').eq('produto_id', id).order('created_at', { ascending: false });
    if (data) setAvaliacoes(data);
  }

  async function handleEnviarAvaliacao(e) {
    e.preventDefault();
    setLoadingAvaliacao(true);
    setMensagemAvaliacao(null);

    try {
      const { error } = await supabase.from('avaliacoes').insert([
        { produto_id: id, nome_cliente: nomeAvaliacao, comentario: textoAvaliacao, nota: notaAvaliacao }
      ]);
      if (error) throw error;
      
      setMensagemAvaliacao({ tipo: 'success', texto: 'Sua avaliação foi enviada com sucesso! Muito obrigado.' });
      setNomeAvaliacao(''); setTextoAvaliacao(''); setNotaAvaliacao(5);
      fetchAvaliacoes();
    } catch (error) {
      setMensagemAvaliacao({ tipo: 'danger', texto: 'Erro ao enviar. Tente novamente.' });
    } finally {
      setLoadingAvaliacao(false);
    }
  }

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
  const galeria = [product.imagem_url, product.imagem_url_2, product.imagem_url_3, product.imagem_url_4].filter(url => url != null && url !== "");

  const mediaEstrelas = avaliacoes.length > 0 ? (avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length).toFixed(1) : 0;

  return (
    <Container className="py-5" style={{ maxWidth: '1000px' }}>
      <Link to="/" className="btn btn-link text-secondary text-decoration-none mb-4 ps-0">
        <FaArrowLeft className="me-2" /> Voltar para a loja
      </Link>

      <Row className="align-items-start mb-5 pb-5 border-bottom border-secondary-subtle">
        <Col md={6} className="mb-4 mb-md-0 position-relative">
          {!disponivel && (
            <div className="position-absolute top-50 start-50 translate-middle z-2">
               <Badge bg="secondary" className="px-4 py-2 fs-5 text-uppercase rounded-0 shadow">Esgotado</Badge>
            </div>
          )}
          
          <div className={`bg-white p-3 shadow-sm mb-3 text-center ${!disponivel ? 'opacity-50' : ''}`}>
             <img src={imagemPrincipal} alt={product.nome} className="img-fluid w-100 rounded" style={{ objectFit: 'contain', maxHeight: '450px', transition: '0.3s' }} onError={(e) => { e.target.src = "https://placehold.co/500?text=Sem+Foto" }} />
          </div>

          {galeria.length > 1 && (
            <div className={`d-flex gap-2 justify-content-center flex-wrap ${!disponivel ? 'opacity-50' : ''}`}>
              {galeria.map((imgUrl, index) => (
                <div key={index} className={`bg-light rounded overflow-hidden p-1 ${imagemPrincipal === imgUrl ? 'border border-dark border-2' : 'border border-light shadow-sm'}`} style={{ width: '80px', height: '80px', cursor: 'pointer' }} onClick={() => setImagemPrincipal(imgUrl)}>
                  <img src={imgUrl} alt={`Foto ${index + 1}`} className="w-100 h-100" style={{ objectFit: 'cover' }} onError={(e) => { e.target.src = "https://placehold.co/80?text=Erro" }} />
                </div>
              ))}
            </div>
          )}
        </Col>

        <Col md={6} className="ps-md-5">
          <div className="d-flex gap-2 mb-3 align-items-center">
            <Badge bg="light" text="dark" className="border text-uppercase letter-spacing-1">{product.categoria}</Badge>
            {isOnPromo && <Badge bg="danger" className="text-uppercase letter-spacing-1">Promoção</Badge>}
          </div>
          
          <h1 className="display-6 mb-2" style={{fontFamily: 'Playfair Display', fontWeight: '600'}}>{product.nome}</h1>

          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="d-flex" style={{ color: '#ffc107', fontSize: '1.1rem' }}>
              {[...Array(5)].map((_, i) => (
                <span key={i} style={{ color: i < Math.round(mediaEstrelas) ? '#ffc107' : '#e4e5e9' }}>★</span>
              ))}
            </div>
            <span className="text-muted small">
              {avaliacoes.length > 0 ? `(${avaliacoes.length} avaliações)` : '(Seja o primeiro a avaliar)'}
            </span>
          </div>

          {product.codigo_final && (
            <div className="text-muted mb-4" style={{ fontSize: '0.85rem', letterSpacing: '0.5px' }}>
              Referência: <span className="fw-semibold font-monospace">{product.codigo_final}</span>
            </div>
          )}
          
          <div className="mb-4">
            {isOnPromo ? (
              <div>
                <span className="text-muted text-decoration-line-through fs-5 me-2">R$ {formatPrice(product.preco_antigo)}</span>
                <h3 className="d-inline price-tag fw-bold" style={{ color: '#ff6b00' }}>R$ {formatPrice(product.preco)}</h3>
              </div>
            ) : (
              <h3 className="price-tag fw-bold text-dark">R$ {formatPrice(product.preco)}</h3>
            )}
          </div>

          <p className="text-muted mb-5" style={{lineHeight: '1.8', fontSize: '1rem'}}>
            {product.descricao || "Uma peça exclusiva da coleção Floressia Pratas. Acabamento impecável e design sofisticado."}
          </p>

          <div className="d-grid gap-3 d-md-flex">
            <Button variant={disponivel ? "dark" : "secondary"} size="lg" className="px-5 rounded-0 text-uppercase letter-spacing-1" style={{ fontSize: '0.9rem' }} onClick={() => disponivel && addToCart(product)} disabled={!disponivel}>
              <FaShoppingCart className="me-2" /> {disponivel ? 'Por na Sacola' : 'Esgotado'}
            </Button>
            
            {disponivel && (
              <Button variant="outline-success" size="lg" className="px-4 rounded-0 text-uppercase letter-spacing-1" style={{ fontSize: '0.9rem' }} onClick={handleBuyNow}>
                <FaWhatsapp className="me-2" /> Comprar Agora
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row className="mt-5">
        <Col md={7} className="mb-5 pe-md-5">
          <h3 style={{fontFamily: 'Playfair Display'}} className="mb-4">Avaliações de Clientes</h3>
          
          {avaliacoes.length === 0 ? (
            <div className="p-4 bg-light text-center border">
              <p className="text-muted mb-0">Nenhuma avaliação ainda. Que tal compartilhar sua experiência após a compra?</p>
            </div>
          ) : (
            <div className="d-flex flex-column gap-4">
              {avaliacoes.map((av) => (
                <div key={av.id} className="pb-4 border-bottom border-secondary-subtle">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold fs-6">{av.nome_cliente}</span>
                    <span className="text-muted small">{new Date(av.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="d-flex mb-2" style={{ color: '#ffc107', fontSize: '0.9rem' }}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} style={{ color: i < av.nota ? '#ffc107' : '#e4e5e9' }}>★</span>
                    ))}
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>{av.comentario}</p>
                </div>
              ))}
            </div>
          )}
        </Col>

        <Col md={5}>
          <div className="bg-light p-4 border border-secondary-subtle">
            <h5 style={{fontFamily: 'Playfair Display'}} className="mb-3">Deixe sua Avaliação</h5>
            
            {mensagemAvaliacao && <Alert variant={mensagemAvaliacao.tipo} className="rounded-0 border-0">{mensagemAvaliacao.texto}</Alert>}

            <Form onSubmit={handleEnviarAvaliacao}>
              <div className="mb-3">
                <Form.Label className="small fw-semibold text-muted text-uppercase mb-1">Sua Nota</Form.Label>
                <div className="d-flex gap-1" style={{ cursor: 'pointer' }}>
                  {[...Array(5)].map((_, index) => {
                    const starValue = index + 1;
                    return (
                      <span 
                        key={starValue}
                        onClick={() => setNotaAvaliacao(starValue)}
                        onMouseEnter={() => setHoverStar(starValue)}
                        onMouseLeave={() => setHoverStar(0)}
                        style={{ color: starValue <= (hoverStar || notaAvaliacao) ? "#ffc107" : "#e4e5e9", fontSize: '2rem', transition: 'color 0.2s' }}
                      >
                        ★
                      </span>
                    );
                  })}
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold text-muted text-uppercase mb-1">Seu Nome</Form.Label>
                <Form.Control type="text" className="rounded-0 border-secondary-subtle" value={nomeAvaliacao} onChange={e => setNomeAvaliacao(e.target.value)} required placeholder="Como prefere ser chamado?" />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="small fw-semibold text-muted text-uppercase mb-1">O que achou da peça?</Form.Label>
                <Form.Control as="textarea" rows={3} className="rounded-0 border-secondary-subtle" value={textoAvaliacao} onChange={e => setTextoAvaliacao(e.target.value)} required placeholder="Ex: A prata brilha muito e o tamanho serviu certinho!" />
              </Form.Group>

              <Button variant="dark" type="submit" className="w-100 rounded-0 text-uppercase letter-spacing-1" disabled={loadingAvaliacao}>
                {loadingAvaliacao ? <Spinner animation="border" size="sm" /> : 'Enviar Avaliação'}
              </Button>
            </Form>
          </div>
        </Col>
      </Row>

    </Container>
  );
}