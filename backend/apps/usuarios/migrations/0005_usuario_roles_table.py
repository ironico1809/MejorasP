from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('usuarios', '0004_roles_y_usuario_rol'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS usuario_roles (
                usuario_id BIGINT REFERENCES usuarios(id) ON DELETE CASCADE,
                rol_id INTEGER REFERENCES rol(id_rol) ON DELETE CASCADE,
                PRIMARY KEY (usuario_id, rol_id)
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS usuario_roles;
            """,
        ),
    ]
