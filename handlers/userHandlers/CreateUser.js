const { handleErrors, successTransaction, getClientInfo, sanitizeEntityData} = require("../../utils/errorHandlers");
const logs = require('../../models/logs.model');
const rolesModel = require("../../models/roles.model");
const signatureModel = require("../../models/signatures.model");
const crypto = require("crypto");

const CreateUser = async (model, req, res) => {
    const sequelize = model.sequelize;
    const transaction = await sequelize.transaction();
    const clientInfo = getClientInfo(req);
    const baseLog = {
        userId: req.user?.id || null,
        loginEmail: req.user?.email || null,
        action: 'Create User',
        entity: 'User',
        ipAddress: clientInfo.ipAddress,
        metadata: {
            client: {
                userAgent: clientInfo.userAgent,
                protocol: clientInfo.protocol,
                endpoint: req.originalUrl
            },
            request: {
                method: req.method,
                params: req.params,
                query: req.query
            },
            system: {
                environment: process.env.NODE_ENV,
                nodeVersion: process.version
            }
        }
    };

    try {
        const { email, roles, departmentId, sign, ...userData } = req.body;

        // Validate required fields
        if (!email || !roles || !departmentId) {
            await logs.create({
                ...baseLog,
                status: "Failed",
                description: "Missing required fields",
                metadata: {
                    ...baseLog.metadata,
                    error: {
                        type: "VALIDATION_ERROR",
                        message: "Missing required fields"
                    },
                    validation: {
                        emailProvided: !!email,
                        rolesProvided: !!roles,
                        departmentIdProvided: !!departmentId
                    }
                }
            });
            throw new Error('Email, roles, and departmentId are required');
        }

        // Generate password hash
        const salt = crypto.randomBytes(16).toString('hex');
        const hashedPassword = crypto.createHash('sha256').update(email + salt).digest('hex');

        const user = {
            ...req.body,
            email,
            password: hashedPassword,
            salt
        };

        // Create user
        const result = await model.create(user, { transaction });

        // Prepare roles data
        const formatRoles = roles.some(item => item === 'applicant')
            ? roles.map(role => ({
                role,
                userId: result.id,
                departmentId
            }))
            : [...roles, "applicant"].map(role => ({
                role,
                userId: result.id,
                departmentId
            }));

        // Create signature
        const signatureData = {
            signature: sign,
            userId: result.id,
        };

        // Execute all creations in transaction
        await signatureModel.create(signatureData, { transaction });
        await rolesModel.bulkCreate(formatRoles, { transaction });

        // Log successful creation
        const successLog = {
            ...baseLog,
            entityId: result.id,
            status: "Success",
            description: "User created successfully",
            metadata: {
                ...baseLog.metadata,
                user: {
                    email: result.email,
                    departmentId: result.departmentId,
                    initialRoles: formatRoles.map(r => r.role)
                },
                security: {
                    passwordHashed: true,
                    saltUsed: !!salt
                },
                timestamps: {
                    createdAt: result.createdAt || new Date().toISOString()
                }
            }
        };

        // Commit transaction first
        await transaction.commit();

        // Then log the success (outside transaction)
        await logs.create(successLog).catch(err =>
            console.error('Failed to write success log:', err)
        );

        return successTransaction(res, 'created', {
            id: result.id,
            email: result.email,
            roles: formatRoles.map(r => r.role)
        });

    } catch (err) {
        // Prepare error log
        const errorLog = {
            ...baseLog,
            status: "Failed",
            description: "Failed to create user",
            metadata: {
                ...baseLog.metadata,
                error: {
                    name: err.name,
                    message: err.message,
                    code: err.code || 'USER_CREATION_ERROR',
                    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
                },
                attemptedData: sanitizeEntityData({
                    email: req.body.email,
                    roles: req.body.roles,
                    departmentId: req.body.departmentId
                }),
                timestamps: {
                    attemptedAt: new Date().toISOString()
                }
            }
        };

        // Rollback transaction first
        await transaction.rollback();

        // Then log the error (outside transaction)
        try {
            await logs.create(errorLog);
        } catch (logErr) {
            console.error('Failed to write error log:', logErr);
            // Fallback logging
            console.error('User creation error:', {
                error: err.message,
                attemptedEmail: req.body.email,
                userId: req.user?.id
            });
        }

        console.log(err);
        return handleErrors(res, err);
    }
};

module.exports = { CreateUser };