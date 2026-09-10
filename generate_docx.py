import os
import zipfile

def create_docx(filename):
    # XML structures for standard WordprocessingML DOCX
    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
    <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
    <Default Extension="xml" ContentType="application/xml"/>
    <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
    <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

    rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

    doc_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:docDefaults>
        <w:rPrDefault>
            <w:rPr>
                <w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:cs="Segoe UI"/>
                <w:sz w:val="22"/>
                <w:color w:val="2D3748"/>
            </w:rPr>
        </w:rPrDefault>
    </w:docDefaults>
</w:styles>"""

    document_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
    <w:body>
        <!-- Document Title -->
        <w:p>
            <w:pPr>
                <w:spacing w:before="200" w:after="80"/>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:b/>
                    <w:sz w:val="48"/>
                    <w:color w:val="1E3A8A"/>
                </w:rPr>
                <w:t>Relatório de Status Executivo — TvCorp</w:t>
            </w:r>
        </w:p>

        <!-- Document Subtitle -->
        <w:p>
            <w:pPr>
                <w:spacing w:before="0" w:after="300"/>
                <w:jc w:val="center"/>
            </w:pPr>
            <w:r>
                <w:rPr>
                    <w:i/>
                    <w:sz w:val="26"/>
                    <w:color w:val="4B5563"/>
                </w:rPr>
                <w:t>Plataforma SaaS de TV Corporativa &amp; Digital Signage</w:t>
            </w:r>
        </w:p>

        <!-- Divider -->
        <w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="12" w:space="1" w:color="3B82F6"/></w:pBdr></w:pPr></w:p>

        <!-- Metadata Table -->
        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="9500" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:left w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:bottom w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:right w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:insideV w:val="single" w:sz="4" w:color="E2E8F0"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>Projeto</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:t>TvCorp (Digital Signage &amp; Mídia Indoor SaaS)</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>Squad Responsável</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:t>A-Team (PO: Mario Henrique / AI Agent: Antigravity)</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>Data do Relatório</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:t>10 de Setembro de 2026</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>Status Geral</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="6500" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>🟢 100% OPERACIONAL (Pronto para Uso)</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>Fase Atual</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="6500" w:type="dxa"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="2563EB"/></w:rPr><w:t>Fase 1 — Produção Operacional / MVP 1.0 (Go-to-Market)</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
        </w:tbl>

        <!-- Section 1 -->
        <w:p><w:pPr><w:spacing w:before="400" w:after="150"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/></w:rPr><w:t>1. Sumário Executivo</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="200"/></w:pPr>
            <w:r><w:t>O TvCorp é uma plataforma SaaS completa voltada para a gestão centralizada de murais digitais, comunicação interna corporativa e mídia indoor em Smart TVs, TV Boxes e navegadores web.</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="200"/></w:pPr>
            <w:r><w:t>Após os ciclos de desenvolvimento, integração de pagamentos e unificação do banco de dados, o sistema atingiu o nível 100% Operacional, estando totalmente apto para receber novos clientes, liberar períodos de degustação gratuita (Trial 7 dias) e processar pagamentos automatizados via Mercado Pago (PIX Instantâneo e Cartão de Crédito até 12x).</w:t></w:r>
        </w:p>

        <!-- Section 2 -->
        <w:p><w:pPr><w:spacing w:before="350" w:after="150"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/></w:rPr><w:t>2. Matriz de Prontidão Operacional</w:t></w:r>
        </w:p>

        <w:tbl>
            <w:tblPr>
                <w:tblW w:w="9500" w:type="dxa"/>
                <w:tblBorders>
                    <w:top w:val="single" w:sz="6" w:color="CBD5E1"/>
                    <w:left w:val="single" w:sz="6" w:color="CBD5E1"/>
                    <w:bottom w:val="single" w:sz="6" w:color="CBD5E1"/>
                    <w:right w:val="single" w:sz="6" w:color="CBD5E1"/>
                    <w:insideH w:val="single" w:sz="4" w:color="E2E8F0"/>
                    <w:insideV w:val="single" w:sz="4" w:color="E2E8F0"/>
                </w:tblBorders>
            </w:tblPr>
            <w:tr>
                <w:tc>
                    <w:tcPr><w:tcW w:w="2800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Módulo</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Status</w:t></w:r></w:p>
                </w:tc>
                <w:tc>
                    <w:tcPr><w:tcW w:w="5000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="1E3A8A"/></w:tcPr>
                    <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Funcionalidade / Descrição</w:t></w:r></w:p>
                </w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Landing Page &amp; Simulador</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Design de alta conversão, simulador de TV animado ao vivo e tabela comparativa de planos.</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Registro &amp; Trial Grátis</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Criação simplificada de conta com ativação automática de 7 dias de degustação.</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Player Digital Signage</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Pareamento em 6 dígitos, atualização em menos de 3s e reprodução offline-first.</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Painel CMS do Cliente</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Gestão de telas ativas, upload de vídeos/imagens e montagem de playlists.</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Gateway Mercado Pago</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>Checkout com PIX dinâmico (QR Code / Copia e Cola) e Cartão de Crédito 12x.</w:t></w:r></w:p></w:tc>
            </w:tr>
            <w:tr>
                <w:tc><w:tcPr><w:tcW w:w="2800" w:type="dxa"/></w:tcPr><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Painel Super Admin</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="1700" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="DCFCE7"/></w:tcPr><w:p><w:r><w:rPr><w:b/><w:color w:val="15803D"/></w:rPr><w:t>Concluído</w:t></w:r></w:p></w:tc>
                <w:tc><w:tcPr><w:tcW w:w="5000" w:type="dxa"/></w:tcPr><w:p><w:r><w:t>KPIs em tempo real (MRR, Clientes, Telas), controle de assinaturas e anúncios.</w:t></w:r></w:p></w:tc>
            </w:tr>
        </w:tbl>

        <!-- Section 3 -->
        <w:p><w:pPr><w:spacing w:before="350" w:after="150"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/></w:rPr><w:t>3. Ambientes e URLs de Acesso</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="2563EB"/></w:rPr><w:t>• Produção (Ambiente Oficial):</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr><w:r><w:t>- Site Oficial: https://tvcorp.hubdigital360.com/index.html</w:t></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr><w:r><w:t>- Player para Smart TV: https://tvcorp.hubdigital360.com/player/</w:t></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr><w:r><w:t>- Painel do Cliente (CMS): https://tvcorp.hubdigital360.com/app.html</w:t></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="150"/></w:pPr><w:r><w:t>- Painel Super Admin: https://tvcorp.hubdigital360.com/admin.html</w:t></w:r></w:p>

        <w:p><w:pPr><w:spacing w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="D97706"/></w:rPr><w:t>• Homologação (Ambiente de Testes / HML):</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr><w:r><w:t>- Site HML: https://tvcorp.hubdigital360.com/hml/index.html</w:t></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="150"/></w:pPr><w:r><w:t>- Player HML: https://tvcorp.hubdigital360.com/hml/player/</w:t></w:r></w:p>

        <w:p><w:pPr><w:spacing w:after="100"/></w:pPr>
            <w:r><w:rPr><w:b/><w:color w:val="1E293B"/></w:rPr><w:t>• Credenciais Padrão do Super Admin:</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="60"/></w:pPr><w:r><w:t>- E-mail: admin@tvcorp.com | Usuário: mariozinhocs (ou admin)</w:t></w:r></w:p>
        <w:p><w:pPr><w:ind w:left="400"/><w:spacing w:after="150"/></w:pPr><w:r><w:t>- Senha: admin123</w:t></w:r></w:p>

        <!-- Section 4 -->
        <w:p><w:pPr><w:spacing w:before="350" w:after="150"/></w:pPr>
            <w:r><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="1E3A8A"/></w:rPr><w:t>4. Próximos Passos (Fase de Escala)</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="80"/></w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t>1. Teste de Estabilidade Contínua (24h/48h): </w:t></w:r>
            <w:r><w:t>Validação de reprodução prolongada em Smart TVs e TV Boxes conectadas em Wi-Fi corporativo.</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="80"/></w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t>2. Campanha de Aquisição &amp; Tráfego: </w:t></w:r>
            <w:r><w:t>Divulgação para escritórios, clínicas e redes de varejo com foco no Trial Grátis de 7 dias.</w:t></w:r>
        </w:p>
        <w:p><w:pPr><w:spacing w:after="200"/></w:pPr>
            <w:r><w:rPr><w:b/></w:rPr><w:t>3. Aplicativo Nativo Android TV (APK): </w:t></w:r>
            <w:r><w:t>Empacotamento PWA / Android Studio para instalação direta via Play Store ou Pen Drive.</w:t></w:r>
        </w:p>

        <!-- Footer Note -->
        <w:p><w:pPr><w:spacing w:before="400"/><w:jc w:val="center"/></w:pPr>
            <w:r><w:rPr><w:i/><w:sz w:val="18"/><w:color w:val="94A3B8"/></w:rPr><w:t>Documento oficial emitido pelo Squad A-Team — TvCorp 2026</w:t></w:r>
        </w:p>
    </w:body>
</w:document>"""

    with zipfile.ZipFile(filename, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', content_types_xml)
        z.writestr('_rels/.rels', rels_xml)
        z.writestr('word/_rels/document.xml.rels', doc_rels_xml)
        z.writestr('word/styles.xml', styles_xml)
        z.writestr('word/document.xml', document_xml)

    print(f"DOCX created successfully at: {filename}")

if __name__ == '__main__':
    target = os.path.join(os.path.dirname(__file__), "Relatorio_Status_Executivo_TvCorp.docx")
    create_docx(target)
