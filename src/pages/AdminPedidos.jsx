import { useState, useEffect } from 'react';
import { Container, Table, Badge, Button, Form, Spinner, Alert, Modal } from 'react-bootstrap';
import { FaArrowLeft, FaBoxOpen } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [atualizando, setAtualizando] = useState(null);
  const [mensagem, setMensagem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itensModal, setItensModal] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

async function fetchPedidos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, perfis (nome, telefone, cep, endereco, numero, complemento, bairro, cidade, estado)')
      .order('created_at', { ascending: false });

    if (data) setPedidos(data);
    setLoading(false);
  }

  async function atualizarPedido(id, novoStatus, novoRastreio) {
    setAtualizando(id);
    setMensagem(null);
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ status: novoStatus, codigo_rastreio: novoRastreio })
        .eq('id', id);

      if (error) throw error;
      setMensagem({ tipo: 'success', texto: `Pedido #${id} atualizado com sucesso!` });
      fetchPedidos();
    } catch (error) {
      setMensagem({ tipo: 'danger', texto: 'Erro ao atualizar pedido.' });
    } finally {
      setAtualizando(null);
    }
  }

  async function verItens(pedido) {
    setPedidoSelecionado(pedido);
    const { data } = await supabase.from('itens_pedido').select('*').eq('pedido_id', pedido.id);
    if (data) setItensModal(data);
    setShowModal(true);
  }

  if (loading) return <div className="text-center py-5 mt-5"><Spinner animation="border" /></div>;

  return (
    <div style={{ backgroundColor: '#fafafa', minHeight: '100vh', paddingBottom: '4rem' }}>
      <div className="bg-white border-bottom shadow-sm py-3 mb-5">
        <Container>
          <Link to="/admin" className="text-decoration-none text-dark d-flex align-items-center fw-bold" style={{fontFamily: 'Playfair Display', fontSize: '1.2rem'}}>
            <FaArrowLeft className="me-2 fs-6 text-muted" /> Voltar ao Painel Admin
          </Link>
        </Container>
      </div>

      <Container>
        <h2 className="mb-4" style={{fontFamily: 'Playfair Display'}}><FaBoxOpen className="me-2 text-muted"/> Gestão de Pedidos</h2>

        {mensagem && <Alert variant={mensagem.tipo} dismissible onClose={() => setMensagem(null)} className="rounded-0 border-0 shadow-sm">{mensagem.texto}</Alert>}

        <div className="bg-white p-4 shadow-sm border border-secondary-subtle">
          {pedidos.length === 0 ? (
            <p className="text-muted text-center py-4">Nenhum pedido recebido ainda.</p>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle text-nowrap">
                <thead className="bg-light text-uppercase small text-muted" style={{letterSpacing: '1px'}}>
                  <tr>
                    <th>Pedido</th>
                    <th>Cliente</th>
                    <th>Data</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Cód. Rastreio</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.id}>
                      <td className="fw-bold fs-5">#{p.id}</td>
                      <td>
                        <div className="fw-bold text-dark">{p.perfis?.nome || 'Cliente Removido'}</div>
                        <div className="small text-muted">{p.perfis?.telefone} • {p.perfis?.cidade}/{p.perfis?.estado}</div>
                      </td>
                      <td>{new Date(p.created_at).toLocaleDateString('pt-BR')}</td>
                      <td className="fw-bold text-success">R$ {p.total.toFixed(2).replace('.', ',')}</td>
                      <td>
                        <Form.Select 
                          size="sm" 
                          className="rounded-0 border-secondary-subtle fw-bold"
                          value={p.status}
                          onChange={(e) => atualizarPedido(p.id, e.target.value, p.codigo_rastreio)}
                          disabled={atualizando === p.id}
                        >
                          <option value="Aguardando Pagamento">Aguardando Pagamento</option>
                          <option value="Pagamento Confirmado">Pagamento Confirmado</option>
                          <option value="Em Separação">Em Separação</option>
                          <option value="Enviado">Enviado</option>
                          <option value="Entregue">Entregue</option>
                          <option value="Cancelado">Cancelado</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control 
                          type="text" 
                          size="sm" 
                          className="rounded-0 text-uppercase border-secondary-subtle"
                          placeholder="Ex: BR123456789BR"
                          defaultValue={p.codigo_rastreio || ''}
                          onBlur={(e) => {
                            if (e.target.value !== (p.codigo_rastreio || '')) {
                              atualizarPedido(p.id, p.status, e.target.value);
                            }
                          }}
                          disabled={atualizando === p.id}
                        />
                      </td>
                      <td>
                        <Button variant="outline-dark" size="sm" className="rounded-0" onClick={() => verItens(p)}>
                          Ver Peças
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </div>
      </Container>

      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title style={{fontFamily: 'Playfair Display'}}>Pedido #{pedidoSelecionado?.id}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <h6 className="text-uppercase small fw-bold text-muted mb-2 letter-spacing-1">📍 Endereço de Entrega:</h6>
          <div className="bg-light p-3 mb-4 border border-secondary-subtle">
            <div className="fw-bold text-dark mb-1">
              {pedidoSelecionado?.perfis?.nome} <span className="fw-normal text-muted ms-2">({pedidoSelecionado?.perfis?.telefone})</span>
            </div>
            <div className="text-muted small" style={{lineHeight: '1.6'}}>
              {pedidoSelecionado?.endereco_entrega ? (
                pedidoSelecionado.endereco_entrega
              ) : (
                <span className="text-danger">Endereço não registrado (Pedido antigo)</span>
              )}
            </div>
            <div className="text-muted small" style={{lineHeight: '1.6'}}>
              {pedidoSelecionado?.perfis?.endereco}, Nº {pedidoSelecionado?.perfis?.numero} <br/>
              {pedidoSelecionado?.perfis?.complemento && <>Complemento: {pedidoSelecionado?.perfis?.complemento} <br/></>}
              Bairro: {pedidoSelecionado?.perfis?.bairro} <br/>
              {pedidoSelecionado?.perfis?.cidade} - {pedidoSelecionado?.perfis?.estado} <br/>
              CEP: {pedidoSelecionado?.perfis?.cep}
            </div>
          </div>

          <h6 className="text-uppercase small fw-bold text-muted mb-3 letter-spacing-1">Itens Comprados:</h6>
          <ul className="list-group list-group-flush border-bottom mb-3">
            {itensModal.map(item => (
              <li key={item.id} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                <div>
                  <span className="fw-bold text-dark">{item.quantidade}x</span> {item.nome_produto}
                  {item.tamanho && <Badge bg="dark" className="ms-2 rounded-0">Tam: {item.tamanho}</Badge>}
                </div>
                <span className="text-muted">R$ {(item.preco_unitario * item.quantidade).toFixed(2).replace('.', ',')}</span>
              </li>
            ))}
          </ul>
        </Modal.Body>
      </Modal>
    </div>
  );
}