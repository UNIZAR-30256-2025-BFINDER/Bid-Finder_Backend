function createSubastasController(subastasService) {
    function getAllSubastas(req, res) {
        const subastas = subastasService.getAllSubastas();
        return res.status(200).json({
            status: "success",
            data: subastas,
        });
    }

    function getSubastaById(req, res) {
        const id = String(req.params.id);

        if (!id || !id.startsWith("BOE")) {
            return res.status(400).json({
                error: {
                    message:
                        "ID debe ser un identificador que comience con 'BOE'",
                    status: 400,
                },
            });
        }

        const subasta = subastasService.getSubastaById(id);

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
    }

    return {
        getSubastaById,
        getAllSubastas,
    };
}

module.exports = createSubastasController;
