const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const paginate = require("../util/paginate");
const cooldown = new Set();

USER_LIKES_PAGE_SIZE = 9;

const createPost = async (req, res) => {
  try {
    const { title, content, userId } = req.body;

    if (!(title && content)) {
      throw new Error("All input required");
    }

    if (cooldown.has(userId)) {
      throw new Error(
        "You are posting too frequently. Please try again shortly."
      );
    }

    cooldown.add(userId);
    setTimeout(() => {
      cooldown.delete(userId);
    }, 60000);

    const post = await Post.create({
      title,
      content,
      poster: userId,
    });

    res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      throw new Error("Post does not exist");
    }

    const post = await Post.findById(postId)
      .populate("poster", "-password")
      .lean();

    if (!post) {
      throw new Error("Post does not exist");
    }

    
    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const updatePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to update post");
    }

    post.content = content;
    post.edited = true;

    await post.save();

    return res.json(post);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const { userId, isAdmin } = req.body;

    const post = await Post.findById(postId);

    if (!post) {
      throw new Error("Post does not exist");
    }

    if (post.poster != userId && !isAdmin) {
      throw new Error("Not authorized to delete post");
    }

    await post.remove();

    

    return res.json(post);
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: err.message });
  }
};




const getPosts = async (req, res) => {
  try {
    const { userId } = req.body;

    let { page,  author, search, liked } = req.query;

   
    if (!page) page = 1;

    let posts = await Post.find()
      .populate("poster", "-password")
      
      .lean();

    if (author) {
      posts = posts.filter((post) => post.poster.username == author);
    }

    if (search) {
      posts = posts.filter((post) =>
        post.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    const count = posts.length;

    posts = paginate(posts, 10, page);

    

    return res.json({ data: posts, count });
  } catch (err) {
    console.log(err.message);
    return res.status(400).json({ error: err.message });
  }
};





module.exports = {
  getPost,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  
};
