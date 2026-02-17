import { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import { supabase } from '../supabase';

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('todos');
  const [destaque, setDestaque] = useState(false);
  const [novidade, setNovidade] = useState(false);
  const [arquivoImagem, setArquivoImagem] = useState(null);

  useEffect(() => {
    fetchProdutos();
  }, []);

  async function fetchProdutos() {
    const { data } = await supabase
      .from('produtos')
      .select('*')
      .order('id', { ascending: false });
    if (data) setProdutos(data);
  }

  function handleEdit(produto) {
    setEditingId(produto.id);
    setNome(produto.nome);
    setPreco(produto.preco);
    setDescricao(produto.descricao || '');
    setCategoria(produto.categoria || 'todos');
    setDestaque(produto.destaque || false);
    setNovidade(produto.novidade || false);
    setArquivoImagem(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setNome('');
    setPreco('');
    setDescricao('');
    setCategoria('todos');
    setDestaque(false);
    setNovidade(false);
    setArquivoImagem(null);
  }

  async function handleDeletar(id) {
    if (window.confirm("Tem certeza que quer excluir este produto?")) {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (!error) {
        fetchProdutos();
        setMensagem({ tipo: 'success', texto: 'Produto excluído.' });
      } else {
        alert("Erro ao excluir: " + error.message);
      }
    }
  }

  async function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    setMensagem(null);

    try {
      let publicUrl = null;

      if (arquivoImagem) {
        const fileExt = arquivoImagem.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('produtos')
          .upload(fileName, arquivoImagem);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('produtos').getPublicUrl(fileName);
        publicUrl = data.publicUrl;
      }

      const dadosProduto = { 
        nome, 
        preco: parseFloat(preco.toString().replace(',', '.')), 
        descricao, 
        categoria,
        destaque,
        novidade
      };

      if (publicUrl) {
        dadosProduto.imagem_url = publicUrl;
      }

      let error;
      
      if (editingId) {
        const { error: updateError } = await supabase
          .from('produtos')
          .update(dadosProduto)
          .eq('id', editingId);
        error = updateError;
        setMensagem({ tipo: 'success', texto: 'Produto atualizado com sucesso!' });
      } else {
        if (!publicUrl && !editingId) {
        }
        const { error: insertError } = await supabase
          .from('produtos')
          .insert([dadosProduto]);
        error = insertError;
        setMensagem({ tipo: 'success', texto: 'Produto cadastrado com sucesso!' });
      }

      if (error) throw error;
      fetchProdutos();
      resetForm();

    } catch (error) {
      console.error(error);
      setMensagem({ tipo: 'danger', texto: 'Erro: ' + error.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0" style={{fontFamily: 'Playfair Display'}}>Gerenciar Produtos</h2>
        {editingId && (
          <Button variant="outline-secondary" onClick={resetForm}>
            Cancelar Edição
          </Button>
        )}
      </div>
      
      {mensagem && <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)}>{mensagem.texto}</Alert>}

      <Form onSubmit={handleSalvar} className="p-4 border rounded shadow-sm bg-white mb-5">
        <h5 className="mb-3 text-muted">
          {editingId ? `Editando Produto #${editingId}` : 'Novo Produto'}
        </h5>
        
        <div className="row">
          <div className="col-md-6 mb-3">
            <Form.Label>Nome da Peça</Form.Label>
            <Form.Control type="text" value={nome} onChange={e => setNome(e.target.value)} required />
          </div>

          <div className="col-md-3 mb-3">
            <Form.Label>Preço (R$)</Form.Label>
            <Form.Control type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} required />
          </div>

          <div className="col-md-3 mb-3">
            <Form.Label>Categoria</Form.Label>
            <Form.Select value={categoria} onChange={e => setCategoria(e.target.value)}>
              <option value="todos">Selecione...</option>
              <option value="aneis">Anéis</option>
              <option value="brincos">Brincos</option>
              <option value="colares">Colares</option>
              <option value="pulseiras">Pulseiras</option>
            </Form.Select>
          </div>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control as="textarea" rows={2} value={descricao} onChange={e => setDescricao(e.target.value)} />
        </Form.Group>

        <div className="row align-items-center mb-3">
          <div className="col-md-6">
             <Form.Label>Foto do Produto {editingId && <small className="text-muted">(Deixe vazio para manter a atual)</small>}</Form.Label>
             <Form.Control type="file" accept="image/*" onChange={e => setArquivoImagem(e.target.files[0])} required={!editingId} />
          </div>
          <div className="col-md-6 d-flex gap-4 mt-3 mt-md-0">
             <Form.Check type="switch" label="Destaque" checked={destaque} onChange={e => setDestaque(e.target.checked)} />
             <Form.Check type="switch" label="Novidade" checked={novidade} onChange={e => setNovidade(e.target.checked)} />
          </div>
        </div>

        <Button variant={editingId ? "warning" : "dark"} type="submit" className="w-100" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : (editingId ? 'Salvar Alterações' : 'Cadastrar Produto')}
        </Button>
      </Form>

      <h4 className="mb-3 mt-5" style={{fontFamily: 'Playfair Display'}}>Lista de Produtos ({produtos.length})</h4>
      <div className="table-responsive bg-white shadow-sm rounded">
        <Table hover className="mb-0 align-middle">
          <thead className="bg-light">
            <tr>
              <th className="ps-3">Foto</th>
              <th>Nome</th>
              <th>Preço</th>
              <th>Categoria</th>
              <th>Tags</th>
              <th className="text-end pe-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {produtos.map(prod => (
              <tr key={prod.id} className={editingId === prod.id ? "table-warning" : ""}>
                <td className="ps-3">
                  <img src={prod.imagem_url || "https://placehold.co/50"} alt="" width="50" height="50" className="rounded object-fit-cover" />
                </td>
                <td className="fw-bold">{prod.nome}</td>
                <td>R$ {prod.preco.toFixed(2)}</td>
                <td><Badge bg="light" text="dark" className="border">{prod.categoria}</Badge></td>
                <td>
                  {prod.destaque && <Badge bg="warning" text="dark" className="me-1">Destaque</Badge>}
                  {prod.novidade && <Badge bg="info" text="white">Novidade</Badge>}
                </td>
                <td className="text-end pe-3">
                  <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEdit(prod)}>
                    <FaEdit />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDeletar(prod.id)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
            {produtos.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4 text-muted">Nenhum produto cadastrado.</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Container>
  );
}