import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Badge, Row, Col, Card, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom'; 
import { FaBoxOpen, FaSignOutAlt, FaTrash, FaTags, FaArrowLeft, FaImage, FaEdit, FaExclamationTriangle, FaPlus, FaUsers, FaStore, FaClipboardList } from 'react-icons/fa';
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
      mensagem: 'Tem certeza que deseja excluir esta peça?',
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
    <div style={{ backgroundColor: '#f4f6f8', minHeight: '100vh', paddingBottom: '5rem' }}>
      <style>{`
        .form-control:focus, .form-select:focus { border-color: #212529; box-shadow: none; background-color: #fff !important; }
        
        .admin-table tbody tr { transition: background-color 0.2s ease; }
        .admin-table tbody tr:hover { background-color: #f8f9fa; }
        .table-container { 
          box-shadow: 0 8px 30px rgba(0,0,0,0.04); 
          border: 1px solid #eaeaea; 
          border-radius: 12px !important;
          overflow: hidden;
        }

        .horizontal-scroll { overflow-x: auto; white-space: nowrap; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .horizontal-scroll::-webkit-scrollbar { display: none; }
        
        .admin-nav-link {
          color: #495057;
          font-weight: 600;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
        }
        .admin-nav-link:hover { background-color: #f1f3f5; color: #000; }
        
        .admin-nav-link-danger {
          color: #dc3545;
          font-weight: 600;
          text-decoration: none;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
        }
        .admin-nav-link-danger:hover { background-color: #fee2e2; color: #c92a2a; }

        .modal-backdrop.show { opacity: 0.7; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); background-color: #000; }
        
        .btn-nova-peca { transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .btn-nova-peca:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(0,0,0,0.2); }
        
        .action-btn { transition: all 0.2s; border-radius: 6px !important;}
        .action-btn:hover { transform: translateY(-2px); }

        @media (max-width: 768px) {
          .admin-header-title { font-size: 1.6rem !important; }
          .admin-header-mobile { flex-direction: column !important; align-items: stretch !important; gap: 15px; padding-top: 15px; padding-bottom: 15px;}
          .nav-btn-mobile { flex: 1 0 auto; font-size: 0.85rem !important; }
          .btn-nova-peca { width: 100%; font-size: 0.95rem !important; padding: 14px !important; letter-spacing: 1px; }
          .table-mobile-font { font-size: 0.85rem !important; }
          .table-mobile-font th, .table-mobile-font td { padding: 12px 10px !important; vertical-align: middle; }
          .img-table { width: 45px !important; height: 45px !important; }
          .modal-body-mobile { padding: 20px 15px !important; }
          .modal-title-mobile { font-size: 1.3rem !important; }
          .input-mobile { padding: 12px !important; font-size: 0.95rem !important; }
        }
      `}</style>

      {/* --- CABEÇALHO --- */}
      <div className="bg-white border-bottom shadow-sm sticky-top" style={{ zIndex: 1020 }}>
        <Container className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center py-3 gap-3">

          <div className="d-flex align-items-center flex-shrink-0" style={{ minWidth: '220px' }}>
            <Link to="/minha-conta" className="text-decoration-none text-dark d-flex align-items-center fw-bold text-nowrap" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem', transition: 'opacity 0.2s'}} onMouseOver={e=>e.currentTarget.style.opacity=0.7} onMouseOut={e=>e.currentTarget.style.opacity=1}>
              <FaArrowLeft className="me-2 fs-6 text-muted" /> Minha Conta
            </Link>
          </div>
          
          <div className="horizontal-scroll d-flex align-items-center justify-content-start justify-content-lg-center gap-2 w-100 pb-1 pb-lg-0 m-0">
            
            <Link to="/" className="d-flex align-items-center justify-content-center gap-2 px-3 py-2 rounded-2 text-uppercase fw-bold text-primary bg-primary bg-opacity-10 text-decoration-none flex-shrink-0 transition-all" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaStore size={14} /> Ver Loja
            </Link>

            <div className="vr d-none d-lg-block mx-2" style={{ backgroundColor: '#dee2e6', width: '2px', height: '24px' }}></div>

            <Link to="/admin" className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaClipboardList size={14} className="text-secondary opacity-75"/> Catálogo
            </Link>
            <button className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={typeof abrirModalCategorias !== 'undefined' ? abrirModalCategorias : null}>
              <FaTags size={14} className="text-secondary opacity-75"/> Categorias
            </button>
            <Link to="/admin/pedidos" className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaBoxOpen size={14} className="text-secondary opacity-75"/> Pedidos
            </Link>
            <Link to="/admin/fornecedores" className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
              <FaUsers size={14} className="text-secondary opacity-75"/> Fornecedores
            </Link>

            <div className="vr d-lg-none mx-1" style={{ backgroundColor: '#dee2e6', width: '2px', height: '24px' }}></div>
            <button className="d-flex d-lg-none align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link-danger flex-shrink-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={typeof handleLogout !== 'undefined' ? handleLogout : null}>
              <FaSignOutAlt size={14}/> Sair
            </button>
          </div>

          <div className="d-none d-lg-flex align-items-center justify-content-end flex-shrink-0" style={{ minWidth: '220px' }}>
            <button className="d-flex align-items-center justify-content-center gap-2 nav-btn-mobile text-uppercase admin-nav-link-danger" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}} onClick={typeof handleLogout !== 'undefined' ? handleLogout : null}>
              <FaSignOutAlt size={14}/> Sair
            </button>
          </div>

        </Container>
      </div>

      <Container className="pt-4 pt-md-5">
        {mensagem && <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-2 border-0 shadow-sm mb-4 fw-bold">{mensagem.texto}</Alert>}

        {/* TÍTULO E BOTÃO */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-4 gap-3">
          <div>
            <h2 className="mb-0 admin-header-title text-dark fw-bold" style={{fontFamily: 'Playfair Display'}}>Catálogo de Peças</h2>
            <p className="text-muted small mb-0 mt-1 letter-spacing-1">{produtos.length} joias no sistema</p>
          </div>
          <Button variant="dark" size="lg" className="rounded-0 px-4 py-2 fw-bold d-flex align-items-center justify-content-center gap-2 btn-nova-peca" onClick={abrirModalNovoProduto}>
            <FaPlus size={14} /> CADASTRAR NOVA PEÇA
          </Button>
        </div>
        
        {/* LISTA DE PRODUTOS */}
        <div className="bg-white table-container">
          <div className="table-responsive horizontal-scroll">
            <Table className="mb-0 align-middle bg-white text-nowrap admin-table table-mobile-font">
              <thead className="bg-light border-bottom">
                <tr className="text-uppercase text-muted" style={{fontSize: '0.75rem', letterSpacing: '1px'}}>
                  <th className="ps-3 ps-md-4 py-3 fw-bold border-0">Foto</th>
                  <th className="py-3 fw-bold border-0">Cód. SKU</th>
                  <th className="py-3 fw-bold border-0">Descrição da Peça</th>
                  <th className="py-3 fw-bold border-0">Preço Venda</th>
                  <th className="text-end pe-3 pe-md-4 py-3 fw-bold border-0">Ações</th>
                </tr>
              </thead>
              <tbody className="border-top-0">
                {produtos.map(prod => {
                  const isPromo = prod.preco_antigo && prod.preco < prod.preco_antigo;
                  return (
                  <tr key={prod.id} className="border-bottom border-light">
                    <td className="ps-3 ps-md-4 py-2 py-md-3">
                      <div className="bg-light border border-secondary-subtle img-table rounded-2" style={{overflow: 'hidden', width: '55px', height: '55px'}}>
                        <img src={prod.imagem_url || "https://placehold.co/55"} alt="" className="w-100 h-100 object-fit-cover" onError={(e) => { e.target.src = "https://placehold.co/55?text=Sem+Foto" }} />
                      </div>
                    </td>
                    <td className="py-2 py-md-3">
                      {prod.codigo_final ? <Badge bg="light" text="dark" className="border border-secondary-subtle rounded-1 font-monospace px-2 py-1 fs-6">{prod.codigo_final}</Badge> : <span className="text-muted small">N/A</span>}
                    </td>
                    <td className="py-2 py-md-3">
                      <div className="fw-bold text-dark text-wrap" style={{minWidth: '160px', fontSize: '0.95rem', lineHeight: '1.2'}}>{prod.nome}</div>
                      <div className="text-muted small text-uppercase mt-1 fw-semibold" style={{fontSize: '0.65rem', letterSpacing: '0.5px'}}>{prod.categoria}</div>
                    </td>
                    <td className="py-2 py-md-3">
                      {isPromo ? (
                        <div className="d-flex flex-column">
                          <span className="text-muted text-decoration-line-through" style={{fontSize: '0.75rem'}}>R$ {prod.preco_antigo.toFixed(2)}</span>
                          <strong className="text-success" style={{ fontSize: '1.05rem' }}>R$ {prod.preco.toFixed(2)}</strong>
                        </div>
                      ) : (<strong className="text-dark" style={{ fontSize: '1.05rem' }}>R$ {prod.preco.toFixed(2)}</strong>)}
                    </td>
                    <td className="text-end pe-3 pe-md-4 py-2 py-md-3">
                      <div className="d-flex justify-content-end gap-2">
                        <Button variant="light" size="sm" className="border border-secondary-subtle px-3 py-2 action-btn shadow-sm text-dark" onClick={() => handleEdit(prod)} title="Editar Peça"><FaEdit /></Button>
                        <Button variant="outline-danger" size="sm" className="px-3 py-2 action-btn shadow-sm" onClick={() => confirmarExclusaoProduto(prod.id)} title="Excluir Peça"><FaTrash /></Button>
                      </div>
                    </td>
                  </tr>
                )})}
                {produtos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                       <FaBoxOpen size={40} className="text-muted opacity-25 mb-3" />
                       <h5 className="text-muted">Sua loja está vazia.</h5>
                       <p className="small text-muted mb-0">Cadastre sua primeira joia clicando no botão acima.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </div>

        <Modal show={showProductModal} onHide={() => setShowProductModal(false)} size="xl" backdrop="static" keyboard={false} centered>
          <Modal.Header closeButton className="border-bottom pb-3 pt-4 px-4 px-md-5 bg-light rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="fw-bold text-dark modal-title-mobile fs-3">
              {editingId ? 'Editar Detalhes da Peça' : 'Cadastrar Nova Peça'}
            </Modal.Title>
          </Modal.Header>
          
          <Modal.Body className="p-4 p-md-5 modal-body-mobile bg-white rounded-bottom-2">
            {erroFormulario && (
              <Alert variant="danger" className="rounded-2 p-3 small mb-4 shadow-sm border-0 d-flex align-items-center gap-2 fw-bold">
                <FaExclamationTriangle size={18}/> {erroFormulario}
              </Alert>
            )}

            <Form onSubmit={handleSalvar}>
              
              {/* INFOS BÁSICAS */}
              <div className="mb-5">
                <h6 className="fw-bold text-uppercase text-muted letter-spacing-1 mb-3 border-bottom pb-2">Informações Principais</h6>
                <Row className="gy-3 mb-4">
                  <Col md={5}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Nome da Peça *</Form.Label>
                    <Form.Control type="text" className="rounded-2 border-secondary-subtle bg-light input-mobile" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Ex: Colar Ponto de Luz Prata 925" />
                  </Col>
                  
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Categoria *</Form.Label>
                    <Form.Select className="rounded-2 border-secondary-subtle bg-light input-mobile" value={categoria} onChange={e => setCategoria(e.target.value)}>
                      <option value="todos">Selecione uma categoria...</option>
                      {categoriasLista.map(cat => (
                        <option key={cat.id} value={cat.nome.toLowerCase()}>{cat.nome}</option>
                      ))}
                    </Form.Select>
                  </Col>

                  <Col md={3} className="d-flex align-items-end pb-1">
                     <div className="w-100 py-3 border-bottom border-dark d-flex align-items-center justify-content-between px-2 bg-light rounded-2">
                       <span className="fw-bold text-dark small text-uppercase">Tem no Estoque?</span>
                       <Form.Check type="switch" id="estoque" checked={emEstoque} onChange={e => setEmEstoque(e.target.checked)} className="fs-5 m-0" />
                     </div>
                  </Col>
                </Row>
              </div>

              {/* FORNECEDOR E SKU */}
              <div className="p-3 p-md-4 border border-secondary-subtle mb-5 bg-light rounded-2">
                <h6 className="fw-bold text-uppercase text-muted letter-spacing-1 mb-3">Origem e Etiqueta</h6>
                <Row className="gy-3 align-items-center">
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Fornecedor</Form.Label>
                    <Form.Select className="rounded-2 input-mobile border-secondary-subtle bg-white" value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}>
                      <option value="">Selecione o fornecedor...</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome} (Cód: {f.codigo})</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Cód. Original (SKU)</Form.Label>
                    <Form.Control type="text" className="rounded-2 input-mobile border-secondary-subtle bg-white" value={codigoProduto} onChange={e => setCodigoProduto(e.target.value)} placeholder="Ex: 6321" />
                  </Col>
                  <Col md={4} className="text-start text-md-end pt-2 pt-md-3 border-top border-md-0 mt-3 mt-md-0">
                    <span className="text-muted small text-uppercase letter-spacing-1">Código Final da Etiqueta:</span><br/>
                    <strong className="fs-4 text-primary font-monospace bg-white px-3 py-1 border border-primary rounded-1 d-inline-block mt-1 mt-md-2 shadow-sm">
                      {fornecedorId && codigoProduto 
                        ? `${fornecedores.find(f => f.id.toString() === fornecedorId.toString())?.codigo || ''}${codigoProduto}` 
                        : '---'}
                    </strong>
                  </Col>
                </Row>
              </div>

              {/* PREÇOS E DESCRIÇÃO */}
              <div className="mb-5">
                <h6 className="fw-bold text-uppercase text-muted letter-spacing-1 mb-3 border-bottom pb-2">Preço e Descrição</h6>
                <Row className="gy-3 mb-4">
                   <Col xs={6} md={4}>
                    <Form.Label className="small fw-bold text-success text-uppercase letter-spacing-1">Preço Atual (R$) *</Form.Label>
                    <Form.Control type="number" step="0.01" className="rounded-2 border-success input-mobile fs-5 fw-bold text-success bg-success bg-opacity-10" value={preco} onChange={e => setPreco(e.target.value)} required placeholder="0.00" />
                  </Col>
                  <Col xs={6} md={4}>
                    <Form.Label className="small fw-bold text-muted text-uppercase letter-spacing-1">Preço Antigo <small className="fw-normal text-danger d-none d-sm-inline">(Cria Promoção)</small></Form.Label>
                    <Form.Control type="number" step="0.01" className="rounded-2 border-secondary-subtle input-mobile text-muted text-decoration-line-through bg-light" value={precoAntigo} onChange={e => setPrecoAntigo(e.target.value)} placeholder="0.00" />
                  </Col>
                </Row>

                <Form.Group className="mb-2">
                  <Form.Label className="small fw-bold text-dark text-uppercase letter-spacing-1">Detalhes da Joia (Aparece na página do produto)</Form.Label>
                  <Form.Control as="textarea" rows={4} className="rounded-2 border-secondary-subtle bg-light p-3" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descreva os detalhes da joia, tamanho, material, dicas de uso..." />
                </Form.Group>
              </div>

              {/* GALERIA DE FOTOS */}
              <div className="mb-4 mb-md-5 p-3 p-md-4 bg-light border border-secondary-subtle rounded-2">
                <h6 className="mb-3 fw-bold text-dark d-flex flex-column flex-md-row align-items-md-center gap-2" style={{fontFamily: 'Playfair Display'}}>
                  <div><FaImage className="text-muted me-2"/> Galeria de Imagens da Peça</div>
                  {editingId && <Badge bg="warning" text="dark" className="ms-md-auto rounded-1 fw-normal align-self-start mt-2 mt-md-0 shadow-sm">Só selecione novas fotos se quiser substituir</Badge>}
                </h6>
                <Row className="gy-3 mt-1">
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-dark text-uppercase">1. Capa (Vitrine) *</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-2 border-secondary-subtle bg-white" onChange={e => setArquivoImagem(e.target.files[0])} required={!editingId} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">2. Detalhe Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-2 border-secondary-subtle bg-white" onChange={e => setArquivoImagem2(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">3. No Corpo / Uso</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-2 border-secondary-subtle bg-white" onChange={e => setArquivoImagem3(e.target.files[0])} />
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Label className="small fw-bold text-muted text-uppercase">4. Imagem Extra</Form.Label>
                    <Form.Control type="file" size="sm" accept="image/*" className="rounded-2 border-secondary-subtle bg-white" onChange={e => setArquivoImagem4(e.target.files[0])} />
                  </Col>
                </Row>
              </div>

              {/* SELOS */}
              <div className="d-flex flex-column flex-sm-row flex-wrap gap-3 gap-md-5 mb-4 mb-md-5 pt-4 border-top border-secondary-subtle">
                 <Form.Check type="switch" id="destaque" label={<span className="fw-bold fs-6">⭐ Destacar na Página Inicial</span>} checked={destaque} onChange={e => setDestaque(e.target.checked)} className="text-dark" />
                 <Form.Check type="switch" id="novidade" label={<span className="fw-bold fs-6">🆕 Selo de Lançamento (New In)</span>} checked={novidade} onChange={e => setNovidade(e.target.checked)} className="text-dark" />
              </div>

              {/* BOTÕES SALVAR/CANCELAR */}
              <div className="d-flex flex-column flex-sm-row gap-2 gap-md-3 justify-content-end bg-light p-3 border-top border-secondary-subtle mx-n4 mx-md-n5 mb-n4 mb-md-n5 mt-4 rounded-bottom-2">
                <Button variant="outline-dark" size="lg" className="rounded-2 px-5 w-100 w-sm-auto fw-bold letter-spacing-1 bg-white" onClick={() => setShowProductModal(false)} disabled={loading}>
                  CANCELAR
                </Button>
                <Button variant="dark" type="submit" size="lg" className="px-5 rounded-2 text-uppercase fw-bold letter-spacing-1 w-100 w-sm-auto shadow-sm action-btn" disabled={loading}>
                  {loading ? <><Spinner animation="border" size="sm" className="me-2" /> SALVANDO...</> : (editingId ? 'SALVAR ALTERAÇÕES' : 'CADASTRAR PEÇA')}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showCategoriaModal} onHide={() => setShowCategoriaModal(false)} centered>
          <Modal.Header closeButton className="border-bottom pb-3 bg-light rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="modal-title-mobile fw-bold">Gerenciar Categorias</Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-4 pb-4 modal-body-mobile bg-white rounded-bottom-2">
          
          {erroCategoria && (
            <Alert variant="danger" className="rounded-2 p-2 text-center small mb-3 fw-bold shadow-sm">
              <FaExclamationTriangle className="me-2"/> {erroCategoria}
            </Alert>
          )}

          <Form onSubmit={handleAddCategoria} className="d-flex flex-column flex-sm-row gap-2 mb-4 p-3 bg-light border border-secondary-subtle shadow-sm rounded-2">
            <Form.Control type="text" placeholder="Ex: Tornozeleiras" className="rounded-2 input-mobile border-secondary-subtle" value={novaCategoria} onChange={e => setNovaCategoria(e.target.value)} required />
            <Button variant="dark" type="submit" className="rounded-2 px-4 fw-bold letter-spacing-1 action-btn shadow-sm" disabled={loadingCategoria}>
              {loadingCategoria ? <Spinner size="sm" animation="border" /> : 'ADICIONAR'}
            </Button>
          </Form>

          <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1 border-bottom pb-2">Categorias Ativas</h6>
          {categoriasLista.length === 0 ? (
            <p className="text-muted small">Nenhuma categoria cadastrada.</p>
          ) : (
            <ul className="list-group list-group-flush border border-secondary-subtle shadow-sm rounded-2 overflow-hidden">
              {categoriasLista.map(cat => (
                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
                  <span className="text-dark fw-bold" style={{fontSize: '0.95rem'}}>{cat.nome}</span>
                  <button onClick={() => confirmarExclusaoCategoria(cat.id)} className="btn btn-link text-danger p-2 text-decoration-none action-btn hover-danger"><FaTrash size={16} /></button>
                </li>
              ))}
            </ul>
          )}
          </Modal.Body>
        </Modal>

        <Modal show={showConfirm} onHide={() => setShowConfirm(false)} centered backdrop="static">
          <Modal.Header closeButton className="border-0 pb-0 pt-4 px-4 bg-white rounded-top-2">
            <Modal.Title style={{fontFamily: 'Playfair Display'}} className="text-danger fw-bold modal-title-mobile fs-3 d-flex align-items-center gap-2">
              <FaExclamationTriangle /> {confirmData.titulo}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="pt-2 pb-4 px-4 modal-body-mobile bg-white rounded-bottom-2">
            <p className="text-dark fs-5 mt-2">{confirmData.mensagem}</p>
            <div className="d-flex flex-column flex-sm-row justify-content-end gap-3 mt-4 pt-4 border-top border-secondary-subtle">
              <Button variant="outline-dark" size="lg" className="rounded-2 px-4 w-100 w-sm-auto fw-bold" onClick={() => setShowConfirm(false)}>CANCELAR</Button>
              <Button variant="danger" size="lg" className="rounded-2 px-5 fw-bold w-100 w-sm-auto shadow-sm action-btn" onClick={confirmData.acao}>SIM, EXCLUIR</Button>
            </div>
          </Modal.Body>
        </Modal>

      </Container>
    </div>
  );
}