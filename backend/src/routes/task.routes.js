import express from 'express';
import { getTasks, createTask, updateTask, deleteTask, getWorkspaces, uploadAttachment } from '../controllers/task.controller.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(protect); // All task routes protected

router.route('/')
  .get(getTasks)
  .post(createTask);

router.route('/:id')
  .put(updateTask)
  .delete(deleteTask);

router.post('/:id/attachments', upload.single('file'), uploadAttachment);

export default router;

export const workspaceRouter = express.Router();
workspaceRouter.use(protect);
workspaceRouter.route('/').get(getWorkspaces);
