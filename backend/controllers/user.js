import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { inngest } from '../inngest/client.js';
import User from '../models/user.js';


export const signup = async (req,res) => {
    const {email ,password , skills =[]} = req.body;
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            skills
        });

        // Try to send Inngest event, but don't fail if it doesn't work
        try {
            await inngest.send({
                name: 'user/signup',
                data: { email }
            });
        } catch (inngestError) {
            console.error("Inngest event failed:", inngestError);
            // Continue with signup even if Inngest fails
        }

       const token = jwt.sign( { _id :user._id , role: user.role }, process.env.JWT_SECRET,{ expiresIn: '1h' } )

        // Send both user and token in the response
        return res.json({ user, token });
    } catch(err){
        console.error("Error during signup:", err.message);
        res.status(500).json({ message: 'Failed to create account. Please try again.' });
    }
}

export const login = async (req,res) => {
    const {email , password} = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Incorrect password' });
        }

        const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        return res.json({ user, token });
    }
    catch (err) {
        console.error("Error during login:", err.message);
        res.status(500).json({ message: 'Login failed. Please try again.' });
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
   const {skills, email, role} = req.body;
    try {
        if (req.user?.role !== 'admin') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
       const user = await User.findOne({email});
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user fields
        if (skills) {
            // Handle both string and array inputs
            user.skills = Array.isArray(skills) 
                ? skills 
                : skills.split(',').map(skill => skill.trim());
        }
        if (role) user.role = role;

        // Save the updated user
        await user.save();

        return res.json({ 
            message: 'User updated successfully', 
            updatedData: {
                skills: user.skills,
                email: user.email,
                role: user.role
            }
        });
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