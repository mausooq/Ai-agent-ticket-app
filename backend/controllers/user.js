import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { inngest } from '../inngest/client.js';
import User from '../models/user.js';


export const signup = async (req,res) => {
    const {email ,password , skills =[]} = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            skills
        });

        await inngest.send({
            name: 'user/signup',
            data: { email }
        })

       const token = jwt.sign( { _id :user._id , role: user.role }, process.env.JWT_SECRET,{ expiresIn: '1h' } )

        return res.json(user , token);
    } catch(err){
        console.error("Error during signup:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const login = async (req,res) => {
    const {email , password} = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ user, token });
    }
    catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const logout = async (req,res) => {
    try{
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        jwt.verify(token, process.env.JWT_SECRET, (err) => {
            if (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
            return res.json({ message: 'Logged out successfully' });
        })
    }

     catch (err) {
        console.error("Error during logout:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }

}

export const updateUser = async (req, res) => {
   const {skills = [] , email ,role} = req.body;
    try {
        if (req.user?.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
       const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const updatedData = {
            skills: skills.length ? skills : user.skills,
            email: email || user.email,
            role: role || user.role
        };
        return res.json({ message: 'User updated successfully', user });
    } catch (err) {
        console.error("Error updating user:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}

export const getUser = async (req, res) => {
    try {
        if(req.user.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const user = await User.find().select('-password'); 
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(user);
    } catch (err) {
        console.error("Error fetching user:", err.message);
        res.status(500).json({ error: 'Internal server error' });
    }
}