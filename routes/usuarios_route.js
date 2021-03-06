const express = require('express');
const ruta = express.Router();

//Modelos
const Usuarios = require('../models/usuarios_model');

//Esquemas (schema)
const schema = require('../schema/usuarios_schema');

// Modulo para encryptar contraseñas
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Middlewares
const verificarToken = require('../middlewares/auth_middleware');

// ****CRUD RUTAS
//?POST
ruta.post('/', (req, res)=>{
    const { nombre, email, password } = req.body; // al usar el express.json(), este formatea a json el nombre

    // Validar si el email ya fue registrado
    Usuarios.findOne({ email }, (err, user)=>{
        // Porblemas con el servidor
        if (err) {
            return res.status(400).json({
                error: 'Server error!'
            });
        }

        // Si el usuario con el email ya existe
        if (user) {
            return res.status(400).json({
                msj: 'El correo usado ya esta registrado'
            });
        }
    }) 

    // Validacion de datos por medio del modulo JOI (esquema)
    const { error, value } = schema.validate({ nombre, email, password });

    // Si existe algun error, retornar el error
    if (error) return res.status(404).send(error);

    const resultado = crearUsuario(value); // Creando el usuario

    // Verificar si el usuario fue creado
    resultado
        .then( usuario => res.json({ 
            nombre: usuario.nombre,
            email: usuario.email
         } ))
        .catch( e => res.status(400).json({
            error: e
        }));
})
//?GET
ruta.get('/', verificarToken, (req, res)=>{
    const usuarios = listarUsuarios();

    usuarios
        .then( usuarios => { res.json({ usuarios }) })
        .catch( e => {res.status(400).json({
            error: e
        })});
})

//?PUT
ruta.put('/:id', verificarToken, (req, res)=>{
    const id = req.params.id;
    const { nombre, email, password } = req.body;

    // Validacion de datos por medio del modulo JOI (esquema)
    const { error, value } = schema.validate({ nombre, email, password });

    // Si existe algun error, retornar el error
    if (error) return res.status(404).send(error);

    const resultado = editarUsuario(id, value);
    
    resultado
        .then( usuario => {res.json({ 
            nombre: usuario.nombre,
            email: usuario.email
            } )})
        .catch( e => {res.status(400).json({
            error: e
        })});
})

//?DELETE (desactivar usuario)
ruta.delete('/:id', verificarToken, (req, res)=>{
    const id = req.params.id;
    const resultado = desactivarUsuario(id);
    
    resultado
        .then( usuario => {res.json({
                nombre: usuario.nombre,
                email: usuario.email
            } )})
        .catch( e => {res.status(400).json({
            error: e
        })});
})


//*****CRUD USUARIOS
//?POST
//Funcion para guardar dato (body, los datos enviados por el cliente)
const crearUsuario = async ({email, nombre, password}) =>{
    // Creando el usuario en base al modelo
    const usuario = new Usuarios({
        email, 
        nombre, 
        password: bcrypt.hashSync(password, saltRounds)
    }) // los demas campos no son requeridos

    try {
        const res = await usuario.save(); // Guardarlo en mongodb
        return res;
    } catch (e) {
        throw e;
    }
}

//?GET
const listarUsuarios = async ()=>{
    try {
        const usuarios = await Usuarios
            .find({estado:true})
            .select({ nombre:1, email: 1 });

        return usuarios;
    } catch (e) {
        throw e;
    }
}

//?PUT
const editarUsuario = async (id, {nombre, email, password}) => {
    try {
        const res = await Usuarios.findByIdAndUpdate({_id: id},{
            $set: {
                nombre,
                email,
                password
            }
        }, { new:true }); 
        return res;

    } catch (e) {
        throw e;
    }
}

//?DELETE (desactivar usuario)
const desactivarUsuario = async id => {
    try {
        const res = await Usuarios.findByIdAndUpdate({_id: id},{
            $set: {
                estado: false
            }
        }, { new:true }); 
        return res;

    } catch (e) {
        throw e;
    }
}

//Exportar todas las rutar
module.exports = ruta;