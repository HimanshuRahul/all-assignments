import express from "express";
import { authenticateJwt, SECRET } from "../middleware/index";
import { Todo } from "../db";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
const router = express.Router();

const TodoSchema = z.object({
  title: z.string().min(1, "Title cannot be empty"),
  description: z.string(),
  done: z.boolean()
}).strict();

router.post('/todos', authenticateJwt, (req, res) => {

  const result = TodoSchema.safeParse(req.body);
  if(!result.success){
    let error = fromZodError(result.error);
    res.status(401).json({error});
    return;
  }

  const userId = req.headers["userId"];
  const { title, description, done } = result.data;

  const newTodo = new Todo({ title, description, done, userId });

  newTodo.save()
    .then((savedTodo) => {
      res.status(201).json(savedTodo);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to create a new todo' });
    });
});


router.get('/todos', authenticateJwt, (req, res) => {
  const userId = req.headers["userId"];

  Todo.find({ userId })
    .then((todos) => {
      res.json(todos);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to retrieve todos' });
    });
});

router.patch('/todos/:todoId/done', authenticateJwt, (req, res) => {
  const { todoId } = req.params;
  const userId = req.headers["userId"];

  Todo.findOneAndUpdate({ _id: todoId, userId }, { done: true }, { new: true })
    .then((updatedTodo) => {
      if (!updatedTodo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      res.json(updatedTodo);
    })
    .catch((err) => {
      res.status(500).json({ error: 'Failed to update todo' });
    });
});

export default router;