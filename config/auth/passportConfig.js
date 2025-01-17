const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('../../models/user.model')
const crypto = require('crypto');

passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findByPk(id,{
            attributes:{exclude: ["password",'salt']},
        })

        if (!user) {
            return done(null, false);
        }
        done(null, user);

    }catch(err) {
        done(err);
    }
})

passport.use(
    new LocalStrategy(
        {
            username:"email",
            password:"password",
        },
        async (username, password, done) => {
            try {
                const user = await User.findOne({where:{email:username}});
                if (!user) {
                    return done(null, false,{message: 'User not found'});
                }

                const hashedPassword = crypto.createHash('sha256').update(password+user.salt).digest('hex');

                if (hashedPassword !== user.password) {
                    return done(null, false,{message: 'Invalid Passwords.'});
                }

                return done(null, user);

            }catch(err) {
                return done(err);
            }
        }
    )
);

module.exports = passport;