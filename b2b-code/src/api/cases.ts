import { NextApiRequest, NextApiResponse } from 'next';
import { connectDB } from '../lib/db';
import Case from '../models/Case';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({ error: 'Database connection failed' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      try {
        const cases = await Case.find({});
        res.status(200).json(cases);
      } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ error: 'Failed to fetch cases' });
      }
      break;

    case 'POST':
      try {
        const newCase = new Case(req.body);
        await newCase.save();
        res.status(201).json(newCase);
      } catch (error) {
        console.error('Error creating case:', error);
        res.status(500).json({ error: 'Failed to create case' });
      }
      break;

    case 'PUT':
      try {
        const { id } = req.query;
        const updatedCase = await Case.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedCase) {
          return res.status(404).json({ error: 'Case not found' });
        }
        res.status(200).json(updatedCase);
      } catch (error) {
        console.error('Error updating case:', error);
        res.status(500).json({ error: 'Failed to update case' });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        const deletedCase = await Case.findByIdAndDelete(id);
        if (!deletedCase) {
          return res.status(404).json({ error: 'Case not found' });
        }
        res.status(200).json({ message: 'Case deleted successfully' });
      } catch (error) {
        console.error('Error deleting case:', error);
        res.status(500).json({ error: 'Failed to delete case' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 