import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Badge, Row, Col, Card } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import { FaEdit, FaTrash, FaArrowLeft, FaImage, FaSignOutAlt, FaPlus, FaBoxOpen } from 'react-icons/fa'; 
import { supabase } from '../supabase';

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [produtos, setProdutos] = useState([]); 
  const [fornecedores, setFornecedores] = useState([]);
  const [editingId, setEditingId] = useState(null); 
  const navigate = useNavigate();

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [precoAntigo, setPrecoAntigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [destaque, setDestaque] = useState(false);
  const [novidade, setNovidade] = useState(false);
  const [emEstoque, setEmEstoque] = useState(true); 
  
  const [fornecedorId, setFornecedorId] = useState('');
  const [codigoProduto, setCodigoProduto] = useState('');

  const [arquivoImagem, setArquivoImagem] = useState(null);
  const [arquivoImagem2, setArquivoImagem2] = useState(null);
  const [arquivoImagem3, setArquivoImagem3] = useState(null);
  const [arquivoImagem4, setArquivoImagem4] = useState(null);

  useEffect(() => {
    fetchProdutos();
    fetchFornecedores();
  }, []);

  async function fetchProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('id', { ascending: false }); 
    if (data) setProdutos(data);
  }

  async function fetchFornecedores() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome', { ascending: true }); 
    if (data) setFornecedores(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function handleEdit(produto) {
    setEditingId(produto.id);
    setNome(produto.nome);
    setPreco(produto.preco);
    setPrecoAntigo(produto.preco_antigo || '');
    setDescricao(produto.descricao || '');
    setCategoria(produto.categoria || 'todos');
    setDestaque(produto.destaque || false);
    setNovidade(produto.novidade || false);
    setEmEstoque(produto.em_estoque !== false); 
    setFornecedorId(produto.fornecedor_id || '');
    setCodigoProduto(produto.codigo_produto || '');
    
    setArquivoImagem(null); setArquivoImagem2(null); setArquivoImagem3(null); setArquivoImagem4(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setNome(''); setPreco(''); setPrecoAntigo(''); setDescricao(''); setCategoria('todos');
    setDestaque(false); setNovidade(false); setEmEstoque(true); 
    setFornecedorId(''); setCodigoProduto('');
    setArquivoImagem(null); setArquivoImagem2(null); setArquivoImagem3(null); setArquivoImagem4(null);
  }

  async function handleDeletar(id) {
    if (window.confirm("Tem certeza que quer excluir definitivamente esta peça?")) {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (!error) {
        fetchProdutos(); 
        setMensagem({ tipo: 'success', texto: 'Peça excluída com sucesso.' });
      }
    }
  }

  async function uploadImagem(arquivo) {
    if (!arquivo) return null;
    const fileExt = arquivo.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const { error } = await supabase.storage.from('produtos').upload(fileName, arquivo);
    if (error) throw error;
    const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      const precoAtualNum = parseFloat(preco.toString().replace(',', '.'));
      const precoAntigoNum = precoAntigo ? parseFloat(precoAntigo.toString().replace(',', '.')) : null;

      if (precoAntigoNum && precoAntigoNum <= precoAtualNum) {
        throw new Error("O 'Preço Antigo' deve ser maior que o 'Preço Atual'.");
      }

      let codFinalGerado = null;
      if (fornecedorId && codigoProduto) {
        const fornSelecionado = fornecedores.find(f => f.id.toString() === fornecedorId.toString());
        if (fornSelecionado) {
          codFinalGerado = `${fornSelecionado.codigo}${codigoProduto}`;
        }
      }

      const url1 = await uploadImagem(arquivoImagem);
      const url2 = await uploadImagem(arquivoImagem2);
      const url3 = await uploadImagem(arquivoImagem3);
      const url4 = await uploadImagem(arquivoImagem4);

      const dadosProduto = { 
        nome, preco: precoAtualNum, preco_antigo: precoAntigoNum, 
        descricao, categoria, destaque, novidade, em_estoque: emEstoque,
        fornecedor_id: fornecedorId || null, 
        codigo_produto: codigoProduto || null,
        codigo_final: codFinalGerado 
      };

      if (url1) dadosProduto.imagem_url = url1;
      if (url2) dadosProduto.imagem_url_2 = url2;
      if (url3) dadosProduto.imagem_url_3 = url3;
      if (url4) dadosProduto.imagem_url_4 = url4;

      let error;
      if (editingId) {
        const { error: updateError } = await supabase.from('produtos').update(dadosProduto).eq('id', editingId);
        error = updateError;
        setMensagem({ tipo: 'success', texto: 'Peça atualizada com sucesso!' });
      } else {
        const { error: insertError } = await supabase.from('produtos').insert([dadosProduto]);
        error = insertError;
        setMensagem({ tipo: 'success', texto: 'Nova peça cadastrada com sucesso!' });
      }

      if (error) throw error;
      fetchProdutos();
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      setMensagem({ tipo: 'danger', texto: 'Erro: ' + error.message });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      
      <div className="bg-white border-bottom shadow-sm py-3 mb-5">
        <Container className="d-flex justify-content-between align-items-center">
          <Link to="/" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Vitrine
          </Link>
          <div className="d-flex align-items-center gap-3">
            {/* BOTÃO PARA TELA DE FORNECEDORES */}
            <Button as={Link} to="/admin/fornecedores" variant="outline-primary" size="sm" className="d-flex align-items-center gap-2 rounded-0">
              <FaBoxOpen /> Fornecedores
            </Button>
            <Button variant="outline-dark" size="sm" className="d-flex align-items-center gap-2 rounded-0 border-0" onClick={handleLogout}>
              <FaSignOutAlt /> Sair
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="mb-0" style={{fontFamily: 'Playfair Display'}}>
            {editingId ? 'Editar Peça' : 'Nova Peça'}
          </h2>
          {editingId && (
            <Button variant="outline-secondary" className="rounded-0" onClick={resetForm}>Cancelar Edição</Button>
          )}
        </div>
        
        {mensagem && <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-0 border-0 shadow-sm">{mensagem.texto}</Alert>}

        <Card className="border-0 shadow-sm rounded-0 mb-5">
          <Card.Body className="p-4 p-md-5">
            <Form onSubmit={handleSalvar}>
              
              <Row className="gy-4 mb-4">
                <Col md={5}>
                  <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Nome da Peça</Form.Label>
                  <Form.Control type="text" className="rounded-0 border-secondary-subtle py-2" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Colar Ponto de Luz Prata" />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Categoria</Form.Label>
                  <Form.Select className="rounded-0 border-secondary-subtle py-2" value={categoria} onChange={e => setCategoria(e.target.value)}>
                    <option value="todos">Selecione...</option>
                    <option value="aneis">Anéis</option>
                    <option value="brincos">Brincos</option>
                    <option value="colares">Colares</option>
                    <option value="pulseiras">Pulseiras</option>
                  </Form.Select>
                </Col>
                <Col md={3} className="d-flex align-items-end pb-1">
                   <div className="w-100 py-2 border-bottom border-secondary-subtle">
                     <Form.Check type="switch" id="estoque" label={<span className="ms-1">Em Estoque</span>} checked={emEstoque} onChange={e => setEmEstoque(e.target.checked)} className="text-dark" />
                   </div>
                </Col>
              </Row>

              {/* --- LINHA DE CÓDIGO DO PRODUTO (NOVO) --- */}
              <div className="bg-light p-3 border border-secondary-subtle mb-4">
                <Row className="gy-3 align-items-center">
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Fornecedor</Form.Label>
                    <Form.Select className="rounded-0 py-2" value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}>
                      <option value="">Selecione...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} (Cód: {f.codigo})</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Cód. Produto (SKU)</Form.Label>
                    <Form.Control type="text" className="rounded-0 py-2" value={codigoProduto} onChange={e => setCodigoProduto(e.target.value)} placeholder="Ex: 6321" />
                  </Col>
                  <Col md={4} className="text-md-end pt-md-3">
                    <span className="text-muted small">Cód. Final Gerado:</span><br/>
                    <strong className="fs-5 text-primary">
                      {fornecedorId && codigoProduto 
                        ? `${fornecedores.find(f => f.id.toString() === fornecedorId.toString())?.codigo || ''}${codigoProduto}` 
                        : '---'}
                    </strong>
                  </Col>
                </Row>
              </div>

              <Row className="gy-4 mb-4 align-items-center">
                 <Col md={4}>
                  <Form.Label className="small fw-semibold text-dark text-uppercase letter-spacing-1">Preço Atual (R$)</Form.Label>
                  <Form.Control type="number" step="0.01" className="rounded-0 border-dark py-2 fw-bold" value={preco} onChange={e => setPreco(e.target.value)} required placeholder="0.00" />
                </Col>
                <Col md={4}>
                  <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Preço Antigo <small className="fw-normal">(Promoção)</small></Form.Label>
                  <Form.Control type="number" step="0.01" className="rounded-0 border-secondary-subtle py-2" value={precoAntigo} onChange={e => setPrecoAntigo(e.target.value)} placeholder="0.00" />
                </Col>
              </Row>

              <Form.Group className="mb-5">
                <Form.Label className="small fw-semibold text-muted text-uppercase letter-spacing-1">Descrição</Form.Label>
                <Form.Control as="textarea" rows={3} className="rounded-0 border-secondary-subtle" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva os detalhes da joia..." />
              </Form.Group>

              {/* GALERIA DE FOTOS */}
              <div className="mb-5">
                <h6 className="mb-3 fw-bold text-dark d-flex align-items-center gap-2" style={{fontFamily: 'Playfair Display'}}>
                  <FaImage className="text-muted"/> Galeria de Imagens
                  {editingId && <span className="ms-auto text-muted small fw-normal font-sans">Só preencha se for alterar a foto</span>}
                </h6>
                <Row className="gy-3">
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">1. Capa (Principal)</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem(e.target.files[0])} required={!editingId} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">2. Detalhe Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem2(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">3. No Corpo</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem3(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small text-muted">4. Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem4(e.target.files[0])} />
                  </Col>
                </Row>
              </div>

              <div className="d-flex flex-wrap gap-4 mb-5 pt-3 border-top border-secondary-subtle">
                 <Form.Check type="switch" id="destaque" label="⭐ Destacar na Vitrine" checked={destaque} onChange={e => setDestaque(e.target.checked)} className="text-dark" />
                 <Form.Check type="switch" id="novidade" label="🆕 Marcar como Lançamento" checked={novidade} onChange={e => setNovidade(e.target.checked)} className="text-dark" />
              </div>

              <Button variant="dark" type="submit" size="lg" className="w-100 py-3 rounded-0 text-uppercase letter-spacing-1" style={{fontSize: '0.9rem'}} disabled={loading}>
                {loading ? <Spinner animation="border" size="sm" /> : (editingId ? 'Atualizar Peça' : 'Cadastrar na Loja')}
              </Button>
            </Form>
          </Card.Body>
        </Card>

        {/* LISTA DE PRODUTOS */}
        <div className="d-flex justify-content-between align-items-end mb-3 mt-5">
          <h4 className="mb-0" style={{fontFamily: 'Playfair Display'}}>Catálogo ({produtos.length})</h4>
        </div>
        
        <Card className="border-0 shadow-sm rounded-0 overflow-hidden">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle bg-white text-nowrap">
              <thead className="bg-light">
                <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                  <th className="ps-4 py-3 fw-semibold">Foto</th>
                  <th className="py-3 fw-semibold">Cód. SKU</th>
                  <th className="py-3 fw-semibold">Peça</th>
                  <th className="py-3 fw-semibold">Preço</th>
                  <th className="text-end pe-4 py-3 fw-semibold">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(prod => {
                  const isPromo = prod.preco_antigo && prod.preco < prod.preco_antigo;
                  return (
                  <tr key={prod.id} className={editingId === prod.id ? "bg-light" : ""}>
                    <td className="ps-4 py-3">
                      <div className="bg-light" style={{width: '45px', height: '45px', overflow: 'hidden'}}>
                        <img src={prod.imagem_url || "https://placehold.co/45"} alt="" className="w-100 h-100 object-fit-cover" onError={(e) => { e.target.src = "https://placehold.co/45?text=Sem+Foto" }} />
                      </div>
                    </td>
                    <td className="py-3">
                      {prod.codigo_final ? <Badge bg="light" text="dark" className="border rounded-0 font-monospace fs-6">{prod.codigo_final}</Badge> : <span className="text-muted small">N/A</span>}
                    </td>
                    <td className="py-3">
                      <div className="fw-bold text-dark text-wrap" style={{minWidth: '180px', fontSize: '0.95rem'}}>{prod.nome}</div>
                      <div className="text-muted small text-uppercase" style={{fontSize: '0.65rem'}}>{prod.categoria}</div>
                    </td>
                    <td className="py-3">
                      {isPromo ? (
                        <div className="d-flex flex-column">
                          <span className="text-muted text-decoration-line-through" style={{fontSize: '0.8rem'}}>R$ {prod.preco_antigo.toFixed(2)}</span>
                          <strong style={{ color: '#ff6b00', fontSize: '1.1rem' }}>R$ {prod.preco.toFixed(2)}</strong>
                        </div>
                      ) : (<strong className="text-dark">R$ {prod.preco.toFixed(2)}</strong>)}
                    </td>
                    <td className="text-end pe-4 py-3">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="outline-dark" size="sm" className="rounded-0 px-3" onClick={() => handleEdit(prod)}><FaEdit /></Button>
                        <Button variant="outline-danger" size="sm" className="rounded-0 px-3 border-0" onClick={() => handleDeletar(prod.id)}><FaTrash /></Button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </Table>
          </div>
        </Card>

      </Container>
    </div>
  );
}