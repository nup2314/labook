from flask import Flask, render_template, abort
from contenido import SECCIONES

app = Flask(__name__)


@app.context_processor
def inyectar_secciones():
    # Disponible en todas las plantillas (para el menú lateral)
    return {"secciones": SECCIONES}


@app.route("/")
def inicio():
    return render_template("inicio.html", actual=None)


@app.route("/seccion/<slug>")
def seccion(slug):
    datos = next((s for s in SECCIONES if s["slug"] == slug), None)
    if datos is None:
        abort(404)
    indice = SECCIONES.index(datos)
    anterior = SECCIONES[indice - 1] if indice > 0 else None
    siguiente = SECCIONES[indice + 1] if indice < len(SECCIONES) - 1 else None
    return render_template(
        "seccion.html", s=datos, actual=slug, anterior=anterior, siguiente=siguiente
    )


@app.errorhandler(404)
def no_encontrado(_):
    return render_template("404.html", actual=None), 404


if __name__ == "__main__":
    app.run(debug=True)
