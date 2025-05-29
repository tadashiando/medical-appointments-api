import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import routes from '../../routes';
import { Appointment } from '../../models/Appointment';
import { Payment } from '../../models/Payment';
import { mockIds } from '../utils/testHelpers';

jest.mock('../../models/Appointment');
jest.mock('../../models/Payment');
jest.mock('jsonwebtoken');

const MockedAppointment = jest.mocked(Appointment);
const MockedPayment = jest.mocked(Payment);
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const app = express();
app.use(express.json());
app.use('/api/v1', routes);

describe('Payment Routes Integration', () => {
  const validToken = 'Bearer valid-jwt-token';
  const patientId = mockIds.patient1;
  const appointmentId = mockIds.appointment1;
  const paymentId = mockIds.payment1;

  beforeEach(() => {
    jest.clearAllMocks();

    mockedJwt.verify = jest.fn().mockImplementation((token, secret, callback) => {
      if (typeof callback === 'function') {
        callback(null, { userId: patientId, role: 'patient' });
      }
    });
  });

  describe('POST /api/v1/payments/process', () => {
    it('should process payment successfully', async () => {
      const mockAppointment = {
        _id: appointmentId,
        patientId,
        status: 'pending',
        paymentStatus: 'pending'
      };

      MockedAppointment.findOne = jest.fn().mockResolvedValue(mockAppointment);
      MockedAppointment.findByIdAndUpdate = jest.fn().mockResolvedValue(true);

      const mockPayment = {
        _id: paymentId,
        status: 'completed',
        transactionId: 'TXN_12345_abc',
        amount: 150,
        save: jest.fn().mockResolvedValue({
          _id: paymentId,
          status: 'completed',
          transactionId: 'TXN_12345_abc',
          amount: 150
        })
      };

      MockedPayment.mockImplementation(() => mockPayment as any);

      jest.spyOn(Math, 'random').mockReturnValue(0.5);

      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', validToken)
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '1234567890123456',
          cardHolder: 'John Doe',
          expiryDate: '12/27',
          cvv: '123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentId: paymentId,
          status: 'completed',
          transactionId: 'TXN_12345_abc',
          amount: 150
        }
      });

      jest.restoreAllMocks();
    });

    it('should fail payment for card ending in 0', async () => {
      const mockAppointment = {
        _id: appointmentId,
        patientId,
        status: 'pending',
        paymentStatus: 'pending'
      };

      MockedAppointment.findOne = jest.fn().mockResolvedValue(mockAppointment);

      const mockPayment = {
        _id: paymentId,
        status: 'failed',
        transactionId: '',
        amount: 150,
        save: jest.fn().mockResolvedValue({
          _id: paymentId,
          status: 'failed',
          transactionId: '',
          amount: 150
        })
      };

      MockedPayment.mockImplementation(() => mockPayment as any);

      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', validToken)
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '1234567890123450', // Ends in 0
          cardHolder: 'John Doe',
          expiryDate: '12/27',
          cvv: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Payment failed - Card declined',
        data: expect.objectContaining({
          status: 'failed'
        })
      });
    });

    it('should return 400 for invalid card data', async () => {
      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', validToken)
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '123', // Invalid length
          cardHolder: 'John Doe',
          expiryDate: '12/27',
          cvv: '123'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.stringContaining('16 digits')
        ])
      });
    });

    it('should return 400 for expired card', async () => {
      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', validToken)
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '1234567890123456',
          cardHolder: 'John Doe',
          expiryDate: '01/20', // Expired
          cvv: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.stringContaining('expired')
        ])
      });
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/payments/process')
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '1234567890123456',
          cardHolder: 'John Doe',
          expiryDate: '12/27',
          cvv: '123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        message: 'Access denied'
      });
    });

    it('should return 400 for already paid appointment', async () => {
      const mockAppointment = {
        _id: appointmentId,
        patientId,
        status: 'pending',
        paymentStatus: 'paid' // Already paid
      };

      MockedAppointment.findOne = jest.fn().mockResolvedValue(mockAppointment);

      // Act
      const response = await request(app)
        .post('/api/v1/payments/process')
        .set('Authorization', validToken)
        .send({
          appointmentId,
          amount: 150,
          paymentMethod: 'credit_card',
          cardNumber: '1234567890123456',
          cardHolder: 'John Doe',
          expiryDate: '12/27',
          cvv: '123'
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        message: 'Appointment is already paid'
      });
    });
  });
});