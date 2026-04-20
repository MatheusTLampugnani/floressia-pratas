import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Badge, Row, Col, Card, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import { FaBoxOpen, FaSignOutAlt, FaTrash, FaTags, FaArrowLeft, FaImage, FaEdit, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import { supabase } from '../supabase';
import imageCompression from 'browser-image-compression'; 

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

  const [showProductModal, setShowProductModal] = useState(false);
  const [erroFormulario, setErroFormulario] = useState(null);
  
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [categoriasLista, setCategoriasLista] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [loadingCategoria, setLoadingCategoria] = useState(false);
  const [erroCategoria, setErroCategoria] = useState(null); 
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmData, setConfirmData] = useState({ titulo: '', mensagem: '', acao: null });

  useEffect(() => {
    fetchProdutos();
    fetchFornecedores();
    carregarCategorias();
  }, []);

  async function fetchProdutos() {
    const { data } = await supabase.from('produtos').select('*').order('id', { ascending: false }); 
    if (data) setProdutos(data);
  }

  async function fetchFornecedores() {
    const { data } = await supabase.from('fornecedores').select('*').order('nome', { ascending: true }); 
    if (data) setFornecedores(data);
  }

  async function carregarCategorias() {
    const { data } = await supabase.from('categorias').select('*').order('nome');
    if (data) setCategoriasLista(data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  function resetForm() {
    setEditingId(null);
    setNome(''); setPreco(''); setPrecoAntigo(''); setDescricao(''); setCategoria('todos');
    setDestaque(false); setNovidade(false); setEmEstoque(true); 
    setFornecedorId(''); setCodigoProduto('');
    setArquivoImagem(null); setArquivoImagem2(null); setArquivoImagem3(null); setArquivoImagem4(null);
    setErroFormulario(null);
  }

  function abrirModalNovoProduto() {
    resetForm();
    setShowProductModal(true);
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
    setErroFormulario(null);
    setShowProductModal(true);
  }

  function confirmarExclusaoProduto(id) {
    setConfirmData({
      titulo: 'Excluir Peça',
      mensagem: 'Tem certeza que quer excluir definitivamente esta peça? Esta ação não pode ser desfeita.',
      acao: async () => {
        const { error } = await supabase.from('produtos').delete().eq('id', id);
        if (!error) {
          fetchProdutos(); 
          setMensagem({ tipo: 'success', texto: 'Peça excluída com sucesso.' });
        }
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  }

  async function uploadImagem(arquivo) {
    if (!arquivo) return null;
    try {
      const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
      const compressedFile = await imageCompression(arquivo, options);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { error } = await supabase.storage.from('produtos').upload(fileName, compressedFile, { cacheControl: '31536000', upsert: false });
      if (error) throw error;
      const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (error) {
      console.error("Erro na compressão/upload da imagem:", error);
      throw error; 
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    setErroFormulario(null);

    try {
      const precoAtualNum = parseFloat(preco.toString().replace(',', '.'));
      const precoAntigoNum = precoAntigo ? parseFloat(precoAntigo.toString().replace(',', '.')) : null;

      if (precoAntigoNum && precoAntigoNum <= precoAtualNum) throw new Error("O 'Preço Antigo' deve ser maior que o 'Preço Atual'.");

      let codFinalGerado = null;
      if (fornecedorId && codigoProduto) {
        const fornSelecionado = fornecedores.find(f => f.id.toString() === fornecedorId.toString());
        if (fornSelecionado) codFinalGerado = `${fornSelecionado.codigo}${codigoProduto}`;
      }

      const url1 = await uploadImagem(arquivoImagem);
      const url2 = await uploadImagem(arquivoImagem2);
      const url3 = await uploadImagem(arquivoImagem3);
      const url4 = await uploadImagem(arquivoImagem4);

      const dadosProduto = { 
        nome, preco: precoAtualNum, preco_antigo: precoAntigoNum, 
        descricao, categoria, destaque, novidade, em_estoque: emEstoque,
        fornecedor_id: fornecedorId || null, codigo_produto: codigoProduto || null, codigo_final: codFinalGerado 
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
      setShowProductModal(false);
      resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) { setErroFormulario('Erro: ' + error.message); } 
    finally { setLoading(false); }
  }

  function abrirModalCategorias() {
    setErroCategoria(null);
    carregarCategorias();
    setShowCategoriaModal(true);
  }

  async function handleAddCategoria(e) {
    e.preventDefault();
    if (!novaCategoria.trim()) return;
    setLoadingCategoria(true);
    setErroCategoria(null);

    try {
      const { error } = await supabase.from('categorias').insert([{ nome: novaCategoria.trim() }]);
      if (error) throw error;
      setNovaCategoria('');
      carregarCategorias(); 
    } catch (error) { setErroCategoria("Erro ao adicionar categoria. Talvez ela já exista."); } 
    finally { setLoadingCategoria(false); }
  }

  function confirmarExclusaoCategoria(id) {
    setConfirmData({
      titulo: 'Excluir Categoria',
      mensagem: 'Tem certeza que deseja excluir esta categoria? As peças que usam ela podem ficar sem categoria.',
      acao: async () => {
        await supabase.from('categorias').delete().eq('id', id);
        carregarCategorias();
        setShowConfirm(false);
      }
    });
    setShowConfirm(true);
  }

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      <style>{`
        /* Menu de navegação rolável no mobile */
        .admin-nav-scroll {
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          padding-bottom: 5px;
        }
        .admin-nav-scroll::-webkit-scrollbar { display: none; }
        
        .img-table { width: 50px; height: 50px; }

        @media (max-width: 768px) {
          .admin-title { font-size: 1.5rem !important; }
          .btn-nova-peca { width: 100%; font-size: 0.9rem !important; padding: 12px !important; }
          .table-mobile-font { font-size: 0.8rem !important; }
          .table-mobile-font th, .table-mobile-font td { padding: 10px 8px !important; }
          .img-table { width: 40px !important; height: 40px !important; }
          .modal-body-mobile { padding: 15px !important; }
          .modal-title-mobile { font-size: 1.2rem !important; }
          .header-admin-mobile { flex-direction: column !important; align-items: stretch !important; gap: 15px; }
        }
      `}</style>

      {/* CABEÇALHO DO ADMIN */}
      <div className="bg-white border-bottom shadow-sm py-3 mb-4 mb-md-5">
        <Container className="header-admin-mobile d-flex justify-content-between align-items-center">
          <Link to="/" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Voltar à Loja
          </Link>
          
          <div className="admin-nav-scroll d-flex align-items-center gap-2 w-100" style={{maxWidth: '100%'}}>
            <Button variant="outline-dark" size="sm" className="d-flex align-items-center gap-2 rounded-0 flex-shrink-0" onClick={abrirModalCategorias}>
              <FaTags /> Categorias
            </Button>
            <Button as={Link} to="/admin/pedidos" variant="outline-dark" size="sm" className="d-flex align-items-center gap-2 rounded-0 flex-shrink-0">
              <FaBoxOpen /> Pedidos
            </Button>
            <Button as={Link} to="/admin/fornecedores" variant="outline-primary" size="sm" className="d-flex align-items-center gap-2 rounded-0 flex-shrink-0">
              <FaBoxOpen /> Fornecedores
            </Button>
            <Button variant="outline-dark" size="sm" className="d-flex align-items-center gap-2 rounded-0 border-0 flex-shrink-0" onClick={handleLogout}>
              <FaSignOutAlt /> Sair
            </Button>
          </div>
        </Container>
      </div>

      <Container>
        {mensagem && <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-0 border-0 shadow-sm mb-4">{mensagem.texto}</Alert>}

        {/* CABEÇALHO DA LISTA DE PRODUTOS */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <h2 className="mb-0 admin-title" style={{fontFamily: 'Playfair Display'}}>Catálogo de Peças</h2>
            <p className="text-muted small mb-0 mt-1">{produtos.length} joias cadastradas na loja</p>
          </div>
          <Button variant="dark" size="lg" className="rounded-0 px-4 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2 btn-nova-peca" onClick={abrirModalNovoProduto}>
            <FaPlus /> CADASTRAR NOVA PEÇA
          </Button>
        </div>
        
        {/* LISTA DE PRODUTOS */}
        <Card className="border-0 shadow-sm rounded-0 overflow-hidden">
          <div className="table-responsive">
            <Table hover className="mb-0 align-middle bg-white text-nowrap table-mobile-font">
              <thead className="bg-light">
                <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                  <th className="ps-3 ps-md-4 py-3 fw-semibold">Foto</th>
                  <th className="py-3 fw-semibold">Cód. SKU</th>
                  <th className="py-3 fw-semibold">Peça</th>
                  <th className="py-3 fw-semibold">Preço</th>
                  <th className="text-end pe-3 pe-md-4 py-3 fw-semibold">Gerenciar</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map(prod => {
                  const isPromo = prod.preco_antigo && prod.preco < prod.preco_antigo;
                  return (
                  <tr key={prod.id}>
                    <td className="ps-3 ps-md-4 py-2 py-md-3">
                      <div className="bg-light border img-table" style={{overflow: 'hidden'}}>
                        <img src={prod.imagem_url || "https://placehold.co/50"} alt="" className="w-100 h-100 object-fit-cover" onError={(e) => { e.target.src = "https://placehold.co/50?text=Sem+Foto" }} />
                      </div>
                    </td>
                    <td className="py-2 py-md-3">
                      {prod.codigo_final ? <Badge bg="light" text="dark" className="border rounded-0 font-monospace fs-6">{prod.codigo_final}</Badge> : <span className="text-muted small">N/A</span>}
                    </td>
                    <td className="py-2 py-md-3">
                      <div className="fw-bold text-dark text-wrap" style={{minWidth: '140px', fontSize: '0.9rem'}}>{prod.nome}</div>
                      <div className="text-muted small text-uppercase mt-1" style={{fontSize: '0.65rem'}}>{prod.categoria}</div>
                    </td>
                    <td className="py-2 py-md-3">
                      {isPromo ? (
                        <div className="d-flex flex-column">
                          <span className="text-muted text-decoration-line-through" style={{fontSize: '0.75rem'}}>R$ {prod.preco_antigo.toFixed(2)}</span>
                          <strong style={{ color: '#ff6b00', fontSize: '1rem' }}>R$ {prod.preco.toFixed(2)}</strong>
                        </div>
                      ) : (<strong className="text-dark">R$ {prod.preco.toFixed(2)}</strong>)}
                    </td>
                    <td className="text-end pe-3 pe-md-4 py-2 py-md-3">
                      <div className="d-flex justify-content-end gap-1 gap-md-2">
                        <Button variant="outline-dark" size="sm" className="rounded-0 px-2 px-md-3" onClick={() => handleEdit(prod)} title="Editar"><FaEdit /></Button>
                        <Button variant="outline-danger" size="sm" className="rounded-0 px-2 px-md-3 border-0" onClick={() => confirmarExclusaoProduto(prod.id)} title="Excluir"><FaTrash /></Button>
                      </div>
                    </td>
                  </tr>
                )})}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      Nenhuma peça cadastrada ainda. Clique no botão acima para começar!
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card>

        <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="xl" backdrop="static" keyboard={false} centered>
          <Modal.Header closeButton className="border-bottom-0 pb-0 pt-3 pt-md-4 px-3 px-md-5">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold text-dark modal-title-mobile fs-3">
              {editingId ? 'Editar Detalhes da Peça' : 'Cadastrar Nova Peça'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="p-4 p-md-5 pt-3 modal-body-mobile">
            {erroFormulario && (
              <Alert variant="danger" className="rounded-0 p-3 small mb-4 shadow-sm border-0 d-flex align-items-center gap-2">
                <FaExclamationTriangle size={18}/> {erroFormulario}
              </Alert>
            )}

            <Form onSubmit={handleSalvar}>
              <Row className="gy-3 mb-4">
                <Col md={5}>
                  <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Nome da Peça</Form.Label>
                  <Form.Control type="text" className="rounded-0 border-secondary-subtle py-2 bg-light" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Colar Ponto de Luz Prata 925" />
                </Col>
                
                <Col md={4}>
                  <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Categoria</Form.Label>
                  <Form.Select className="rounded-0 border-secondary-subtle py-2 bg-light" value={categoria} onChange={e => setCategoria(e.target.value)}>
                    <option value="todos">Selecione uma categoria...</option>
                    {categoriasLista.map(cat => (
                      <option key={cat.id} value={cat.nome.toLowerCase()}>{cat.nome}</option>
                    ))}
                  </Form.Select>
                </Col>

                <Col md={3} className="d-flex align-items-end pb-1">
                   <div className="w-100 py-2 border-bottom border-dark">
                     <Form.Check type="switch" id="estoque" label={<span className="ms-1 fw-bold text-dark">Produto em Estoque</span>} checked={emEstoque} onChange={e => setEmEstoque(e.target.checked)} />
                   </div>
                </Col>
              </Row>

              <div className="p-3 p-md-4 border border-secondary-subtle mb-4" style={{ backgroundColor: '#f8f9fa' }}>
                <Row className="gy-3 align-items-center">
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-muted text-uppercase letter-spacing-1">Fornecedor (Origem)</Form.Label>
                    <Form.Select className="rounded-0 py-2" value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}>
                      <option value="">Selecione o fornecedor...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} (Cód: {f.codigo})</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-muted text-uppercase letter-spacing-1">Cód. Original (SKU)</Form.Label>
                    <Form.Control type="text" className="rounded-0 py-2" value={codigoProduto} onChange={e => setCodigoProduto(e.target.value)} placeholder="Ex: 6321" />
                  </Col>
                  <Col md={4} className="text-start text-md-end pt-2 pt-md-3 border-top border-md-0 mt-3 mt-md-0">
                    <span className="text-muted small text-uppercase letter-spacing-1">Código de Etiqueta Gerado:</span><br/>
                    <strong className="fs-4 text-dark font-monospace bg-white px-3 py-1 border d-inline-block mt-1 mt-md-2">
                      {fornecedorId && codigoProduto 
                        ? `${fornecedores.find(f => f.id.toString() === fornecedorId.toString())?.codigo || ''}${codigoProduto}` 
                        : '---'}
                    </strong>
                  </Col>
                </Row>
              </div>

              <Row className="gy-3 mb-4">
                 <Col xs={6} md={4}>
                  <Form.Label className="small fw-bold text-success text-uppercase letter-spacing-1">Preço Atual (R$)</Form.Label>
                  <Form.Control type="number" step="0.01" className="rounded-0 border-success py-2 py-md-3 fs-5 fw-bold text-success" value={preco} onChange={e => setPreco(e.target.value)} required placeholder="0.00" />
                </Col>
                <Col xs={6} md={4}>
                  <Form.Label className="small fw-bold text-muted text-uppercase letter-spacing-1">Preço Antigo <small className="fw-normal text-danger d-none d-sm-inline">(Promoção)</small></Form.Label>
                  <Form.Control type="number" step="0.01" className="rounded-0 border-secondary-subtle py-2 py-md-3 text-muted text-decoration-line-through" value={precoAntigo} onChange={e => setPrecoAntigo(e.target.value)} placeholder="0.00" />
                </Col>
              </Row>

              <Form.Group className="mb-4 mb-md-5">
                <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Descrição Detalhada</Form.Label>
                <Form.Control as="textarea" rows={4} className="rounded-0 border-secondary-subtle bg-light" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva os detalhes da joia, tamanho, material, dicas de uso..." />
              </Form.Group>

              {/* GALERIA DE FOTOS */}
              <div className="mb-4 mb-md-5">
                <h6 className="mb-3 fw-bold text-dark d-flex flex-column flex-md-row align-items-md-center gap-2 border-bottom pb-2" style={{fontFamily: 'Playfair Display'}}>
                  <div><FaImage className="text-muted me-2"/> Galeria de Imagens da Peça</div>
                  {editingId && <Badge bg="warning" text="dark" className="ms-md-auto rounded-0 fw-normal align-self-start mt-2 mt-md-0">Só selecione novas fotos se quiser substituir</Badge>}
                </h6>
                <Row className="gy-3">
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">1. Capa (Vitrine)</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem(e.target.files[0])} required={!editingId} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">2. Detalhe Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem2(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">3. No Corpo / Uso</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem3(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">4. Imagem Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-0" onChange={e => setArquivoImagem4(e.target.files[0])} />
                  </Col>
                </Row>
              </div>

              <div className="d-flex flex-column flex-sm-row flex-wrap gap-3 gap-md-5 mb-4 mb-md-5 pt-4 border-top border-dark">
                 <Form.Check type="switch" id="destaque" label={<span className="fw-bold">⭐ Destacar na Página Inicial</span>} checked={destaque} onChange={e => setDestaque(e.target.checked)} className="text-dark" />
                 <Form.Check type="switch" id="novidade" label={<span className="fw-bold">🆕 Selo de Lançamento (New In)</span>} checked={novidade} onChange={e => setNovidade(e.target.checked)} className="text-dark" />
              </div>

              <div className="d-flex flex-column flex-sm-row gap-2 gap-md-3 justify-content-end">
                <Button variant="outline-secondary" size="lg" className="rounded-0 px-4 w-100 w-sm-auto" onClick={() => setShowProductModal(false)} disabled={loading}>
                  Cancelar
                </Button>
                <Button variant="dark" type="submit" size="lg" className="px-5 rounded-0 text-uppercase fw-bold letter-spacing-1 w-100 w-sm-auto" disabled={loading}>
                  {loading ? <><Spinner animation="border" size="sm" className="me-2" /> SALVANDO...</> : (editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PEÇA')}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showCategoriaModal} onHide={() => setShowCategoriaModal(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="modal-title-mobile fw-bold">Gerenciar Categorias</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2 pb-4 modal-body-mobile">
          
          {erroCategoria && (
            <Alert variant="danger" className="rounded-0 p-2 text-center small mb-3">
              <FaExclamationTriangle className="me-2"/> {erroCategoria}
            </Alert>
          )}

          <Form onSubmit={handleAddCategoria} className="d-flex flex-column flex-sm-row gap-2 mb-4 p-3 bg-light border border-secondary-subtle">
            <Form.Control type="text" placeholder="Ex: Tornozeleiras" className="rounded-0" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} required />
            <Button variant="dark" type="submit" className="rounded-0 px-4" disabled={loadingCategoria}>
              {loadingCategoria ? <Spinner size="sm" animation="border" /> : 'Adicionar'}
            </Button>
          </Form>

          <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1">Categorias Cadastradas</h6>
          {categoriasLista.length === 0 ? (
            <p className="text-muted small">Nenhuma categoria cadastrada.</p>
          ) : (
            <ul className="list-group list-group-flush border">
              {categoriasLista.map(cat => (
                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                  <span className="text-dark fw-bold" style={{fontSize: '0.9rem'}}>{cat.nome}</span>
                  <button onClick={() => confirmarExclusaoCategoria(cat.id)} className="btn btn-link text-danger p-2 text-decoration-none"><FaTrash size={14} /></button>
                </li>
              ))}
            </ul>
          )}
          </Modal.Body>
        </Modal>

        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="text-danger fw-bold modal-title-mobile">
              {confirmData.titulo}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2 pb-4 modal-body-mobile">
            <p className="text-muted" style={{fontSize: '0.95rem'}}>{confirmData.mensagem}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-end gap-2 mt-4 pt-3 border-top">
              <Button variant="outline-dark" className="rounded-0 px-4 w-100 w-sm-auto" onClick={() => setShowConfirm(false)}>Cancelar</Button>
              <Button variant="danger" className="rounded-0 px-4 fw-bold w-100 w-sm-auto" onClick={confirmData.acao}>Sim, Excluir</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
}