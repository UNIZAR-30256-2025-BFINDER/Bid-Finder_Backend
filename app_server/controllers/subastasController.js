function createSubastasController(subastasService) {
    
    async function getAllSubastas(req, res) {
        try {
            const { provincia, categoria, precio_min, precio_max, nivel_oportunidad, q } = req.query;
            
            const filtros = {};
            if (provincia) filtros.provincia = provincia;
            if (categoria) filtros.categoria = categoria;
            if (q) filtros.q = q;
            if (precio_min) filtros.precio_min = precio_min;
            if (precio_max) filtros.precio_max = precio_max;
            if (nivel_oportunidad) filtros.nivel_oportunidad = nivel_oportunidad;

            const subastas = await subastasService.getAllSubastas(filtros);
            
            return res.status(200).json({
                status: "success",
                meta: {
                    filtrosAplicados: filtros,
                    total: subastas.length
                },
                data: subastas,
            });
        } catch (error) {
            console.error("Error en getAllSubastas:", error);
            return res.status(500).json({
                error: {
                    message: "Error al recuperar las subastas de la base de datos",
                    status: 500
                }
            });
        }
    }

    async function getSubastaById(req, res) {
        try {
            const id = String(req.params.id);

            if (!id || !id.startsWith("BOE")) {
                return res.status(400).json({
                    error: {
                        message: "ID debe ser un identificador que comience con 'BOE'",
                        status: 400,
                    },
                });
            }

            const subasta = await subastasService.getSubastaById(id);

            if (!subasta) {
                return res.status(404).json({
                    error: {
                        message: "Subasta no encontrada",
                        status: 404,
                    },
                });
            }

            return res.status(200).json({
                status: "success",
                data: subasta,
            });
        } catch (error) {
            console.error(`Error en getSubastaById para ID ${req.params.id}:`, error);
            return res.status(500).json({
                error: {
                    message: "Error interno al buscar la subasta",
                    status: 500
                }
            });
        }
    }

    return {
        getSubastaById,
        getAllSubastas,
    };
}

module.exports = createSubastasController;