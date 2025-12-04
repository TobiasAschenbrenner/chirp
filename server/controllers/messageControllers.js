const HttpError = require("../models/errorModel");
const ConversationModel = require("../models/conversationModel");
const MessageModel = require("../models/messageModel");
const { io, getReceiverSocketId } = require("../socket/socket");

// CREATE MESSAGE
// POST : api/messages/:receiverId
// PROTECTED
const createMessage = async (req, res, next) => {
  try {
    const { receiverId } = req.params;
    const { messageBody } = req.body;
    // check if conversation exists between sender and receiver
    let conversation = await ConversationModel.findOne({
      participants: { $all: [req.user.id, receiverId] },
    });
    // create new conversation if not exists
    if (!conversation) {
      conversation = await ConversationModel.create({
        participants: [req.user.id, receiverId],
        lastMessage: { text: messageBody, senderId: req.user.id },
      });
    }
    // create new message
    const newMessage = await MessageModel.create({
      conversationId: conversation._id,
      senderId: req.user.id,
      text: messageBody,
    });
    await conversation.updateOne({
      lastMessage: { text: messageBody, senderId: req.user.id },
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json(newMessage);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET MESSAGES
// GET : api/messages/:receiverId
// PROTECTED
const getMessage = async (req, res, next) => {
  try {
    const { receiverId } = req.params;
    const conversation = await ConversationModel.findOne({
      participants: { $all: [req.user.id, receiverId] },
    });
    if (!conversation) {
      return next(new HttpError("No conversation found", 404));
    }
    const messages = await MessageModel.find({
      conversationId: conversation._id,
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    return next(new HttpError(error));
  }
};

// GET CONVERSATIONS
// POST : api/conversations
// PROTECTED
const getConversations = async (req, res, next) => {
  try {
    let conversations = await ConversationModel.find({
      participants: req.user.id,
    })
      .populate({ path: "participants", select: "fullName profilePhoto" })
      .sort({ updatedAt: -1 });
    // remove current user from participants array
    conversations.forEach((conversation) => {
      conversation.participants = conversation.participants.filter(
        (participant) => participant._id.toString() !== req.user.id.toString()
      );
    });
    res.json(conversations);
  } catch (error) {
    return next(new HttpError(error));
  }
};

module.exports = {
  createMessage,
  getMessage,
  getConversations,
};
