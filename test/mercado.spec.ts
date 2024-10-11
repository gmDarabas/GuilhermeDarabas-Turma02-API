import pactum from 'pactum';
import { SimpleReporter } from '../simple-reporter';
import { faker } from '@faker-js/faker';
import { StatusCodes } from 'http-status-codes';

describe('Mercado API', () => {

  const p = pactum;
  const rep = SimpleReporter;
  const baseUrl = 'https://api-desafio-qa.onrender.com';

  let mercadoId: number;

  p.request.setDefaultTimeout(90000);

  beforeEach(async () => {
    p.reporter.add(rep);
    mercadoId = await p
      .spec()
      .get(`${baseUrl}/mercado`)
      .expectStatus(StatusCodes.OK)
      // .expectJsonSchema(mercadoSchema) Não é possível validar schema
      .returns('[0].id');
  });

  describe('Mercado', () => {
    it('Busca um mercado por ID', async () => {
      await p
        .spec()
        .get(`${baseUrl}/mercado/${mercadoId}`)
        .expectStatus(StatusCodes.OK)
        // .expectJsonSchema(mercadoSchema) Não da para validar schema
        .expectJsonLike({
          id: mercadoId
        })
    });

    it('Cadastra um mercado com sucesso', async () => {
      const nome = faker.company.name();
      const cnpj = faker.number.bigInt({ min: 10000000000000, max: 99999999999999 }).toString();
      const endereco = faker.location.streetAddress();

      await pactum.spec()
        .post(`${baseUrl}/mercado`)
        .withJson({
          nome: nome,
          cnpj: cnpj,
          endereco: endereco
        })
        .expectStatus(201)
        .expectJsonLike({
          message: `Mercado '${nome}' adicionado com sucesso com todas as subcategorias iniciais vazias!`,
          novoMercado: {
            nome,
            cnpj,
            endereco
          }
        })
    });

    it('Deve retornar erro cnpj inválido', async () => {
      const nome = faker.company.name();
      const cnpjInvalido = '12345';
      const endereco = faker.location.streetAddress();

      await pactum.spec()
        .post(`${baseUrl}/mercado`)
        .withJson({
          nome,
          cnpj: cnpjInvalido,
          endereco
        })
        .expectStatus(400)
        .expectJsonLike({
          errors: [
            {
              location: 'body',
              msg: 'CNPJ deve ter 14 dígitos',
              path: 'cnpj',
              type: 'field',
            },
          ],
        });
    });

    it('Deve atualizar os dados do mercado com sucesso', async () => {
      const novoNome = faker.company.name();
      const novoEndereco = faker.location.streetAddress();

      await pactum.spec()
        .put(`${baseUrl}/mercado/${mercadoId}`)
        .withJson({
          nome: novoNome,
          endereco: novoEndereco
        })
        .expectStatus(200)
        .expectJsonLike({
          message: `Mercado com ID ${mercadoId} atualizado com sucesso.`,
          updatedMercado: {
            id: mercadoId,
            nome: novoNome,
            endereco: novoEndereco,
          }
        })
    });

    it('Deve excluir um mercado com sucesso', async () => {
      await pactum.spec()
        .delete(`${baseUrl}/mercado/${mercadoId}`)
        .expectStatus(200)
        .expectJsonLike({
          message: `Mercado com ID ${mercadoId} foi removido com sucesso.`
        })
    });
  });

  describe('Frutas', () => {
    it('Deve cadastrar um produto na categoria frutas', async () => {
      const nome = faker.food.fruit();
      const valor = faker.number.int({ min: 0, max: 100 })

      await pactum.spec()
        .post(`${baseUrl}/mercado/${mercadoId}/produtos/hortifruit/frutas`)
        .withJson({
          nome,
          valor
        })
        .expectStatus(201)
        .expectBodyContains('adicionado com sucesso')
        .expectBodyContains(nome)
        .expectBodyContains(valor)
        .expectJsonLike({
          product_item: {
            nome,
            valor
          }
        })
    });

    it('Deve causar erro ao cadastrar uma fruta com valor negativo', async () => {
      const nome = faker.food.fruit();
      const valor = -15

      await pactum.spec()
        .post(`${baseUrl}/mercado/${mercadoId}/produtos/hortifruit/frutas`)
        .withJson({
          nome,
          valor
        })
        .expectStatus(400)
        .expectJsonLike({
          errors: [
            {
              "type": "field",
              "msg": "Valor deve ser um número inteiro e não negativo",
              "path": "valor",
              "location": "body"
            }
          ],
        });
    });
  })
  afterAll(() => p.reporter.end());

});
