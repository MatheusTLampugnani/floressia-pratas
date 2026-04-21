import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Button, Spinner, Badge, Form, InputGroup, Card, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaTruck, FaShieldAlt, FaRegGem, FaHeart, FaRegHeart, FaShoppingCart, FaStar, FaRegStar, FaUserCircle } from 'react-icons/fa';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [produto, setProduto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imagemPrincipal, setImagemPrincipal] = useState('');
  const [imagensGaleria, setImagensGaleria] = useState([]);
  
  const [relacionados, setRelacionados] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [cep, setCep] = useState('');
  const [loadingFrete, setLoadingFrete] = useState(false);
  const [resultadoFrete, setResultadoFrete] = useState(null);

  const [avaliacoes, setAvaliacoes] = useState([]);
  const [novaNota, setNovaNota] = useState(0);
  const [notaHover, setNotaHover] = useState(0);
  const [novoComentario, setNovoComentario] = useState('');
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  useEffect(() => {
    carregarProduto();
    carregarAvaliacoes();
    window.scrollTo(0, 0); 
  }, [id]);

  async function carregarProduto() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('produtos').select('*').eq('id', id).single();
      if (error) throw error;
      
      setProduto(data);
      setImagemPrincipal(data.imagem_url);

      const galeria = [data.imagem_url, data.imagem_url_2, data.imagem_url_3, data.imagem_url_4].filter(Boolean);
      setImagensGaleria(galeria);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: favData } = await supabase.from('favoritos').select('*').eq('user_id', session.user.id).eq('produto_id', id).maybeSingle();
        if (favData) setIsFavorite(true);
      }

      const { data: relData } = await supabase.from('produtos').select('*').eq('categoria', data.categoria).neq('id', data.id).limit(4);
      if (relData) setRelacionados(relData);

    } catch (err) {
      console.error("Erro ao carregar produto", err);
      navigate('/'); 
    } finally {
      setLoading(false);
    }
  }

  async function carregarAvaliacoes() {
    const { data } = await supabase
      .from('avaliacoes')
      .select('*, perfis(nome)')
      .eq('produto_id', id)
      .order('created_at', { ascending: false });
    if (data) setAvaliacoes(data);
  }

  async function handleAvaliar(e) {
    e.preventDefault();
    if (novaNota === 0) {
      alert("Por favor, selecione uma nota de 1 a 5 estrelas antes de enviar.");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }

    setEnviandoAvaliacao(true);
    try {
      const { error } = await supabase.from('avaliacoes').insert([{
        produto_id: id,
        user_id: session.user.id,
        nota: novaNota,
        comentario: novoComentario.trim()
      }]);
      if (error) throw error;
      
      setNovaNota(0);
      setNovoComentario('');
      carregarAvaliacoes();
    } catch (err) {
      console.error("Erro ao salvar avaliação", err);
      alert("Tivemos um erro ao enviar sua avaliação. Tente novamente.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  }

  const mediaAvaliacoes = avaliacoes.length > 0 
    ? (avaliacoes.reduce((acc, av) => acc + av.nota, 0) / avaliacoes.length).toFixed(1) 
    : 0;

  async function toggleFavorite() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowLoginModal(true);
      return;
    }
    if (isFavorite) {
      await supabase.from('favoritos').delete().eq('user_id', session.user.id).eq('produto_id', produto.id);
      setIsFavorite(false);
    } else {
      await supabase.from('favoritos').insert([{ user_id: session.user.id, produto_id: produto.id }]);
      setIsFavorite(true);
    }
  }

  async function calcularFrete() {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      setResultadoFrete({ erro: true, texto: 'Digite um CEP válido.' });
      return;
    }
    setLoadingFrete(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        setResultadoFrete({ erro: true, texto: 'CEP não encontrado.' });
      } else {
        setResultadoFrete({ 
          erro: false, 
          cidade: `${data.localidade}/${data.uf}`,
          prazo: '5 a 10 dias úteis',
          valor: 'Calculado no WhatsApp'
        });
      }
    } catch (err) {
      setResultadoFrete({ erro: true, texto: 'Erro ao consultar CEP.' });
    } finally {
      setLoadingFrete(false);
    }
  }

  if (loading) return <div className="text-center py-5 my-5"><Spinner animation="border" variant="dark" /></div>;
  if (!produto) return null;

  const isPromo = produto.preco_antigo && produto.preco < produto.preco_antigo;
  const disponivel = produto.em_estoque !== false;

  return (
    <Container className="py-4 py-md-5 mb-5 min-vh-100">
      <button onClick={() => navigate(-1)} className="btn btn-link text-secondary text-decoration-none mb-4 ps-0 d-inline-flex align-items-center small">
        <FaArrowLeft className="me-2" /> Voltar
      </button>

      <Row className="gy-5 gx-lg-5 mb-5 pb-4 border-bottom border-secondary-subtle">
        <Col md={6}>
          <div className="position-relative bg-light border border-secondary-subtle mb-3 d-flex align-items-center justify-content-center" style={{ aspectRatio: '1/1', overflow: 'hidden' }}>
            {isPromo && (
              <Badge bg="danger" className="position-absolute top-0 start-0 m-3 rounded-0 z-1 px-3 py-2" style={{ letterSpacing: '1px' }}>PROMOÇÃO</Badge>
            )}
            <img src={imagemPrincipal} alt={produto.nome} className="w-100 h-100 object-fit-cover" style={{ transition: 'opacity 0.3s ease' }} />
          </div>

          {imagensGaleria.length > 1 && (
            <Row className="g-2">
              {imagensGaleria.map((img, idx) => (
                <Col xs={3} key={idx}>
                  <div 
                    className={`bg-light border ${imagemPrincipal === img ? 'border-dark border-2' : 'border-secondary-subtle'} cursor-pointer`}
                    style={{ aspectRatio: '1/1', overflow: 'hidden', cursor: 'pointer', opacity: imagemPrincipal === img ? 1 : 0.6 }}
                    onClick={() => setImagemPrincipal(img)}
                  >
                    <img src={img} alt={`Ângulo ${idx+1}`} className="w-100 h-100 object-fit-cover" />
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Col>

        <Col md={6} className="d-flex flex-column">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <span className="text-uppercase text-muted small letter-spacing-1">{produto.categoria}</span>
            <button onClick={toggleFavorite} className="btn btn-link text-danger p-0 shadow-none border-0">
              {isFavorite ? <FaHeart size={22} /> : <FaRegHeart size={22} className="text-muted" />}
            </button>
          </div>
          
          <h1 className="fs-2 mb-2 text-dark fw-bold" style={{fontFamily: 'Playfair Display'}}>{produto.nome}</h1>
        
          <div className="d-flex align-items-center gap-2 mb-4 cursor-pointer" onClick={() => document.getElementById('avaliacoes').scrollIntoView({ behavior: 'smooth' })}>
            <div className="text-warning d-flex align-items-center">
              {[...Array(5)].map((star, index) => {
                const isFilled = index < Math.round(mediaAvaliacoes);
                return isFilled ? <FaStar key={index} size={16} /> : <FaRegStar key={index} size={16} />;
              })}
            </div>
            <span className="text-muted small text-decoration-underline">
              {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'}
            </span>
          </div>
          
          <div className="mb-4">
            {isPromo ? (
              <div className="d-flex align-items-center gap-3">
                <h3 className="mb-0 fw-bold text-success">R$ {produto.preco.toFixed(2).replace('.', ',')}</h3>
                <span className="text-muted text-decoration-line-through fs-5">R$ {produto.preco_antigo.toFixed(2).replace('.', ',')}</span>
              </div>
            ) : (
              <h3 className="mb-0 fw-bold text-dark">R$ {produto.preco.toFixed(2).replace('.', ',')}</h3>
            )}
            <p className="text-muted small mt-1">em até 3x sem juros no cartão</p>
          </div>

          <Button 
            variant={disponivel ? "dark" : "secondary"} 
            size="lg" 
            className="w-100 rounded-0 text-uppercase fw-bold letter-spacing-1 py-3 mb-4 d-flex align-items-center justify-content-center gap-2 shadow-sm"
            disabled={!disponivel}
            onClick={() => { if (disponivel) addToCart(produto); }}
          >
            {disponivel ? <><FaShoppingCart /> Adicionar à Sacola</> : 'Esgotado no Momento'}
          </Button>

          <div className="bg-light p-4 border border-secondary-subtle mb-4">
            <h6 className="fw-bold text-uppercase small letter-spacing-1 mb-3"><FaTruck className="me-2" /> Simular Frete e Prazo</h6>
            <InputGroup className="mb-3">
              <Form.Control 
                placeholder="Seu CEP (Apenas números)" 
                className="rounded-0 bg-white border-secondary-subtle shadow-none"
                value={cep}
                onChange={e => setCep(e.target.value)}
                maxLength={8}
              />
              <Button variant="outline-dark" className="rounded-0 px-4" onClick={calcularFrete} disabled={loadingFrete}>
                {loadingFrete ? <Spinner size="sm" animation="border" /> : 'OK'}
              </Button>
            </InputGroup>
            
            {resultadoFrete && (
              <div className={`small p-2 ${resultadoFrete.erro ? 'text-danger' : 'text-success bg-white border border-success'}`}>
                {resultadoFrete.erro ? resultadoFrete.texto : (
                  <div>
                    <strong>Entrega para:</strong> {resultadoFrete.cidade} <br/>
                    <strong>Prazo estimado:</strong> {resultadoFrete.prazo} <br/>
                    <span className="text-muted" style={{fontSize: '0.7rem'}}>*O frete final e exato será calculado no WhatsApp.</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-auto">
            <h6 className="fw-bold text-uppercase small letter-spacing-1 mb-2 border-bottom pb-2">Detalhes da Joia</h6>
            <p className="text-muted mb-4" style={{lineHeight: '1.8', fontSize: '0.95rem', whiteSpace: 'pre-line'}}>
              {produto.descricao || 'Sem descrição detalhada para esta peça.'}
            </p>
            
            <ul className="list-unstyled text-muted small mb-0 d-flex flex-column gap-2">
              <li><FaRegGem className="me-2 text-dark" /> Material: <strong>Prata 925 Legítima</strong></li>
              <li><FaShieldAlt className="me-2 text-dark" /> Garantia: <strong>Vitalícia na cor da prata</strong></li>
              {produto.codigo_final && <li><span className="fw-bold me-2 text-dark">SKU:</span> {produto.codigo_final}</li>}
            </ul>
          </div>
        </Col>
      </Row>

      <div id="avaliacoes" className="mb-5 pb-5 border-bottom border-secondary-subtle">
        <h3 className="fs-3 mb-4" style={{fontFamily: 'Playfair Display'}}>Avaliações de Clientes</h3>
        <Row className="gy-4">
          <Col md={5} lg={4}>
            <div className="bg-light p-4 border border-secondary-subtle text-center mb-4">
              <h1 className="display-3 fw-bold text-dark mb-0">{mediaAvaliacoes}</h1>
              <div className="text-warning mb-2">
                {[...Array(5)].map((star, index) => {
                  const isFilled = index < Math.round(mediaAvaliacoes);
                  return isFilled ? <FaStar key={index} size={20} /> : <FaRegStar key={index} size={20} />;
                })}
              </div>
              <p className="text-muted small mb-0">Baseado em {avaliacoes.length} avaliações</p>
            </div>

            <h6 className="fw-bold text-uppercase small letter-spacing-1 mb-3">Avalie esta joia</h6>
            <Form onSubmit={handleAvaliar}>
              <div className="d-flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    style={{ cursor: 'pointer' }}
                    onMouseEnter={() => setNotaHover(star)}
                    onMouseLeave={() => setNotaHover(0)}
                    onClick={() => setNovaNota(star)}
                  >
                    {star <= (notaHover || novaNota) ? (
                      <FaStar size={28} className="text-warning" style={{transition: 'color 0.2s'}} />
                    ) : (
                      <FaRegStar size={28} className="text-secondary opacity-50" style={{transition: 'color 0.2s'}} />
                    )}
                  </div>
                ))}
              </div>
              <Form.Control 
                as="textarea" 
                rows={3} 
                className="rounded-0 border-secondary-subtle mb-3 bg-light" 
                placeholder="Conte o que achou da peça, da qualidade e do envio..." 
                value={novoComentario}
                onChange={e => setNovoComentario(e.target.value)}
              />
              <Button variant="dark" type="submit" className="w-100 rounded-0 text-uppercase letter-spacing-1" disabled={enviandoAvaliacao}>
                {enviandoAvaliacao ? <Spinner size="sm" animation="border"/> : 'Enviar Avaliação'}
              </Button>
            </Form>
          </Col>

          <Col md={7} lg={8}>
            {avaliacoes.length === 0 ? (
              <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted opacity-50 py-5">
                <FaRegStar size={40} className="mb-3" />
                <h5>Nenhuma avaliação ainda.</h5>
                <p className="small">Seja a primeira pessoa a avaliar esta joia!</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3" style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '10px' }}>
                {avaliacoes.map(av => (
                  <div key={av.id} className="p-3 border border-secondary-subtle bg-white">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <FaUserCircle size={24} className="text-secondary opacity-50" />
                        <span className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>{av.perfis?.nome || 'Cliente Floréssia'}</span>
                      </div>
                      <small className="text-muted" style={{fontSize: '0.75rem'}}>
                        {new Date(av.created_at).toLocaleDateString('pt-BR')}
                      </small>
                    </div>
                    <div className="text-warning mb-2" style={{fontSize: '0.8rem'}}>
                      {[...Array(5)].map((_, i) => i < av.nota ? <FaStar key={i} /> : <FaRegStar key={i} />)}
                    </div>
                    {av.comentario && <p className="text-muted small mb-0" style={{lineHeight: '1.6'}}>{av.comentario}</p>}
                  </div>
                ))}
              </div>
            )}
          </Col>
        </Row>
      </div>

      {relacionados.length > 0 && (
        <div className="mt-5 pt-2">
          <div className="text-center mb-5">
            <h3 className="fs-2" style={{fontFamily: 'Playfair Display'}}>Você também vai amar</h3>
            <div style={{ width: '50px', height: '2px', backgroundColor: '#212529', margin: '0 auto' }}></div>
          </div>
          
          <Row className="g-2 g-md-4 mx-0">
            {relacionados.map(rel => (
              <Col xs={6} md={3} key={rel.id} className="mb-3">
                <Card className="h-100 shadow-sm border-0 position-relative rounded-0">
                  <Link to={`/produto/${rel.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div className="bg-light" style={{ overflow: 'hidden', aspectRatio: '1/1' }}>
                      <Card.Img variant="top" src={rel.imagem_url || "https://placehold.co/300"} className="rounded-0 h-100 w-100 object-fit-cover" style={{transition: 'transform 0.3s ease'}} />
                    </div>
                    <Card.Body className="text-center p-2 p-md-3">
                      <Card.Title style={{fontFamily: 'Playfair Display', fontSize: '0.9rem'}} className="text-truncate mb-1">{rel.nome}</Card.Title>
                      <span className="fw-bold text-dark" style={{fontSize: '0.9rem'}}>R$ {rel.preco.toFixed(2).replace('.', ',')}</span>
                    </Card.Body>
                  </Link>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}

      <Modal show={showLoginModal} onHide={() => setShowLoginModal(false)} centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title style={{fontFamily: 'Playfair Display'}}>Acesse sua conta</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center pb-4 pt-2">
          <FaUserCircle size={40} className="text-secondary mb-3 opacity-50" />
          <p className="text-muted mb-4 px-2">Faça login ou crie uma conta rapidinho para poder interagir e salvar joias!</p>
          <div className="d-flex flex-column flex-sm-row justify-content-center gap-2">
            <Button variant="outline-secondary" className="rounded-0 px-4" onClick={() => setShowLoginModal(false)}>Agora não</Button>
            <Button as={Link} to="/login" variant="dark" className="rounded-0 px-4" onClick={() => setShowLoginModal(false)}>Fazer Login</Button>
          </div>
        </Modal.Body>
      </Modal>

    </Container>
  );
}